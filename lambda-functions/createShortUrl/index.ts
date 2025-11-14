import { ddbClient } from "../shared/dynamodbClient";
import { generateShortCode } from "../shared/generateShortCode";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const TABLE_NAME = process.env.URL_MAPPINGS_TABLE!;
const SHORT_URL_DOMAIN = process.env.SHORT_URL_DOMAIN!;
const MAX_RETRIES = 3;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request: Missing body" }) };
  }

  let longUrl: string | undefined;
  let customAlias: string | undefined;
  try {
    const body = JSON.parse(event.body);
    longUrl = body.longUrl;
    customAlias = body.customAlias;
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request: Malformed JSON" }) };
  }

  if (!longUrl || !/^https?:\/\//.test(longUrl)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid URL" }) };
  }

  // If a custom alias is provided, try to use it directly (no retries needed).
  if (customAlias) {
    // It's good practice to add some basic validation for the alias itself.
    if (!/^[a-zA-Z0-9_-]{3,16}$/.test(customAlias)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid alias. Use 3-16 alphanumeric characters, hyphens, or underscores." }) };
    }
    try {
      return await createAndSaveLink(longUrl, customAlias);
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        return { statusCode: 409, body: JSON.stringify({ error: "This custom alias is already taken. Please choose another." }) };
      }
      return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
    }
  }

  // If no custom alias, generate a random one with retries on collision.
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const shortCode = generateShortCode();
      // We attempt to create the link. If it succeeds, it will return and exit the loop.
      return await createAndSaveLink(longUrl, shortCode);
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        // This is a collision on a *random* code. Log it and let the loop retry.
        console.log(`Collision detected on attempt ${i + 1}. Retrying...`);
        continue;
      }
      // For any other unexpected error during the save attempt, fail immediately.
      console.error("Error creating short URL:", error);
      return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
    }
  }

  // If all retries fail
  return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate a unique short code. Please try again." }) };
};

/**
 * Attempts to save a new link to DynamoDB and returns a success response.
 * Throws an error on failure, which the caller must handle.
 */
const createAndSaveLink = async (longUrl: string, shortCode: string): Promise<APIGatewayProxyResult> => {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      shortCode: { S: shortCode },
      longUrl: { S: longUrl },
      createdAt: { S: new Date().toISOString() },
      clickCount: { N: "0" },
    },
    ConditionExpression: "attribute_not_exists(shortCode)",
  };

  // The send command will throw an error if the condition check fails.
  await ddbClient.send(new PutItemCommand(params));

  // If it does not throw, the operation was successful.
  const protocol = process.env.AWS_SAM_LOCAL ? "http" : "https";
  return {
    statusCode: 200,
    body: JSON.stringify({
      shortUrl: `${protocol}://${SHORT_URL_DOMAIN}/${shortCode}`,
      shortCode,
    }),
  };
};
