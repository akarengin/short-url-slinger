import { ddbClient } from "@shared/dynamodbClient";
import { GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const TABLE_NAME = process.env.URL_MAPPINGS_TABLE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const shortCode = event.pathParameters?.shortCode;

  if (!shortCode) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing shortCode in path" }),
    };
  }

  const getParams = {
    TableName: TABLE_NAME,
    Key: { shortCode: { S: shortCode } },
  };

  try {
    const data = await ddbClient.send(new GetItemCommand(getParams));

    if (!data.Item || !data.Item.longUrl?.S) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "URL not found" }),
      };
    }

    const longUrl = data.Item.longUrl.S;

    // Fire-and-forget the click count update to reduce latency for the user.
    // Note: In extreme high-traffic, there's a small chance this might not complete
    // if the Lambda execution environment is terminated immediately after the redirect response.
    // For this application, it's an acceptable trade-off.
    const updateParams = {
      TableName: TABLE_NAME,
      Key: { shortCode: { S: shortCode } },
      UpdateExpression: "ADD clickCount :inc",
      ExpressionAttributeValues: { ":inc": { N: "1" } },
    };
    ddbClient.send(new UpdateItemCommand(updateParams)).catch(console.error);

    // Issue a permanent redirect.
    return {
      statusCode: 301,
      headers: {
        Location: longUrl,
      },
      body: "",
    };
  } catch (error) {
    console.error("Error retrieving or updating URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
