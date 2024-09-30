import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import neo4j from "neo4j-driver";

export async function main() {
  // S3 client checks automatically for AWS access keys in the environment, so
  // no need to specify here.
  const s3Client = new S3Client({ region: "us-west-2" });
  const bucketName = "lxp-regulator-scrape-repository";

  try {
    const response = await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `s3-test-document-${Date.now()}.txt`,
        Body: "Test document created from Node.js",
      })
    );

    const status = response.$metadata.httpStatusCode;
    if (status == 200) {
      console.log(
        "cloud-resource-test-script: Validated AWS credentials. 1 document uploaded."
      );
    }
  } catch (err) {
    console.log(
      "cloud-resource-test-script: Failed to validate AWS credentials. 0 documents uploaded."
    );
    console.log(err);
  }

  try {
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;
    const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

    async function runCypher(query, parameters, targetDB, driver) {
      let { records, summary } = await driver.executeQuery(query, parameters, {
        database: targetDB,
      });

      return summary;
    }

    const summary = await runCypher(
      `CREATE (:Test { name: $testName, type: "cloud-resource-test" })`,
      { testName: `neo4j-test-node-${Date.now()}` },
      "neo4j",
      driver
    );

    if (summary.counters._stats.nodesCreated == 1) {
      console.log(
        "cloud-resource-test-script: Validated Neo4j credentials. 1 node uploaded."
      );
      driver.close();
    }
  } catch (err) {
    console.log(
      "cloud-resource-test-script: Failed to validate Neo4j credentials. 0 nodes uploaded."
    );
    console.log(err);
    driver.close();
  }
}

main();
