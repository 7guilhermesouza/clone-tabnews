test("GET to /api/v1/status should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  const responseJson = await response.json();
  const updated_at = responseJson.updated_at;
  const parsedUpdatedAt = new Date(updated_at).toISOString();
  expect(updated_at).toBe(parsedUpdatedAt);
  expect(responseJson.dependencies.database.version).toEqual("16.9");
  expect(responseJson.dependencies.database.max_connections).toEqual(100);
  expect(responseJson.dependencies.database.opened_connections).toEqual(1);
});
