import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// When running in a local SAM container, 'localhost' refers to the container itself.
// We must use the special DNS name 'host.docker.internal' to connect to services
// running on the host machine (like the DynamoDB Local Docker container).
const dynamoDbEndpoint = process.env.IS_OFFLINE
  ? "http://host.docker.internal:8000"
  : undefined;

const ddbClient = new DynamoDBClient({
  endpoint: dynamoDbEndpoint,
  // When running locally, we don't need real AWS credentials.
  // Providing dummy credentials prevents the SDK from trying to fetch them.
  ...(process.env.IS_OFFLINE && {
    region: "localhost", // This is also required for the SDK to work with a local endpoint
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
  }),
});

export { ddbClient };
