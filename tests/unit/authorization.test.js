import { InternalServerError } from "@/infra/errors";
import authorization from "@/model/authorization.js";
import { describe, expect, test } from "@jest/globals";

describe("authorization assertions", () => {
  describe("authorization.can()", () => {
    test("Without user", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("Without user.features", () => {
      const createdUser = {
        username: "Username",
      };
      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("Without feature", () => {
      const createdUser = {
        features: ["read:user"],
      };
      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("Nonexixtent feature", () => {
      const createdUser = {
        features: ["nonexistent:feature"],
      };
      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });
  });

  describe("authorization.filterOutput()", () => {
    test("Without user", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("Without user.features", () => {
      const createdUser = {
        username: "Username",
      };
      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("Without feature", () => {
      const createdUser = {
        features: ["read:user"],
      };
      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });
  });
});
