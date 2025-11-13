import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const ddbClient = new DynamoDBClient({
  ...(process.env.AWS_SAM_LOCAL && {
    endpoint: "http://DynamoDBEndpoint:8000",
    region: "us-east-1",
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
  }),
});

export { ddbClient };
