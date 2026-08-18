test("GET to `/api/v1/status` should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);

  const parsedResponse = await response.json();
  expect(parsedResponse.update_at).toBeDefined();

  const parsedUpdatedAt = new Date(parsedResponse.update_at).toISOString();
  expect(parsedResponse.update_at).toEqual(parsedUpdatedAt);

  expect(parsedResponse.dependencies.database.version).toEqual("16.14");
  expect(parsedResponse.dependencies.database.max_connections).toEqual(100);
  expect(parsedResponse.dependencies.database.opened_connections).toEqual(1);
});
