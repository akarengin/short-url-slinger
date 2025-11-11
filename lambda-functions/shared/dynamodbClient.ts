import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// Best practice: Create the client once and reuse it across all function invocations.
// The AWS SDK will manage the underlying connections.
const ddbClient = new DynamoDBClient({});

export { ddbClient };
