import { ForbiddenError, InternalServerError } from "@/infra/errors";

const permissionPolicies = {
  user: userPolicy,
  session: sessionPolicy,
  activation_token: activationTokenPolicy,
  status: statusPolicy,
  migrations: migrationsPolicy,
};

function userPolicy(user, feature, resource) {
  let response = {
    owner: false,
    can: false,
    appliedFeature: feature,
  };

  function hasResource() {
    return resource !== null;
  }

  function isAuthenticatedUser() {
    return Boolean(user?.id);
  }

  function hasPermission(necessaryFeature) {
    if (necessaryFeature === false) {
      response.can = false;
    } else {
      response.can = user.features.includes(necessaryFeature);
      response.appliedFeature = necessaryFeature;
    }

    return can;
  }

  function isOwner() {
    if (user?.id && resource?.id) {
      if (user.id === resource.id) {
        response.owner = true;
      }
    }

    return response.owner;
  }

  const action = feature.split(":")[0];

  switch (action) {
    case "create":
      isAuthenticatedUser()
        ? hasPermission(false)
        : hasPermission("create:user");
      break;
    case "read":
      hasPermission("read:user");
      break;
    case "update":
      if (!isAuthenticatedUser()) {
        hasPermission(false);
      } else if (isAuthenticatedUser() && !hasResource()) {
        hasPermission("update:user");
      } else if (isAuthenticatedUser() && hasResource()) {
        isOwner()
          ? hasPermission("update:user")
          : hasPermission("update:user:others");
      }
      break;
  }

  return response;
}
// eslint-disable-next-line no-unused-vars
function sessionPolicy(user, feature, resource) {
  let response = {
    owner: false,
    can: false,
    appliedFeature: feature,
  };

  function hasPermission(necessaryFeature) {
    if (necessaryFeature === false) {
      response.can = false;
    } else {
      response.can = user.features.includes(necessaryFeature);
      response.appliedFeature = necessaryFeature;
    }

    return can;
  }

  const action = feature.split(":")[0];

  switch (action) {
    case "create":
      hasPermission("create:session");
      break;
    case "read":
      hasPermission("read:session");
      break;
    case "delete":
      hasPermission("delete:session");
      break;
  }

  return response;
}
// eslint-disable-next-line no-unused-vars
function activationTokenPolicy(user, feature, resource) {
  let response = {
    owner: false,
    can: false,
    appliedFeature: feature,
  };

  function hasPermission(necessaryFeature) {
    if (necessaryFeature === false) {
      response.can = false;
    } else {
      response.can = user.features.includes(necessaryFeature);
      response.appliedFeature = necessaryFeature;
    }

    return can;
  }

  const action = feature.split(":")[0];

  switch (action) {
    case "read":
      hasPermission("read:activation_token");
      break;
  }

  return response;
}

// eslint-disable-next-line no-unused-vars
function statusPolicy(user, feature, resource) {
  let response = {
    owner: false,
    can: false,
    appliedFeature: feature,
  };

  function hasPermission(necessaryFeature) {
    if (necessaryFeature === false) {
      response.can = false;
    } else {
      response.can = user.features.includes(necessaryFeature);
      response.appliedFeature = necessaryFeature;
    }

    return can;
  }

  const action = feature.split(":")[0];

  switch (action) {
    case "read":
      hasPermission(feature);
      break;
  }

  return response;
}

// eslint-disable-next-line no-unused-vars
function migrationsPolicy(user, feature, resource) {
  let response = {
    owner: false,
    can: false,
    appliedFeature: feature,
  };

  function hasPermission(necessaryFeature) {
    if (necessaryFeature === false) {
      response.can = false;
    } else {
      response.can = user.features.includes(necessaryFeature);
      response.appliedFeature = necessaryFeature;
    }

    return can;
  }

  const action = feature.split(":")[0];

  switch (action) {
    case "create":
      hasPermission("create:migrations");
      break;
    case "read":
      hasPermission("read:migrations");
      break;
  }
  return response;
}

function validateUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: "Missing parameter `user` in `authorization`",
    });
  }
}

function resourceTarget(feature) {
  return feature?.split(":")[1]; // tipo do recurso - user, session, etc
}

function validateFeature(feature) {
  const requiredFeature = resourceTarget(feature);
  if (!feature || !(requiredFeature in permissionPolicies)) {
    throw new InternalServerError({
      cause: "Missing parameter `feature` in `authorization`",
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause: "Missing parameter `resource` in `authorization`",
    });
  }
}

function can(user, feature, resource = null, unauthorized = "throw") {
  validateUser(user);
  validateFeature(feature);

  const resourceTargetItem = resourceTarget(feature);

  const policy = permissionPolicies[resourceTargetItem];
  const userCanDoIt = policy(user, feature, resource);

  if (!userCanDoIt.can) {
    if (unauthorized === "return") {
      return userCanDoIt;
    } else {
      throw new ForbiddenError({});
    }
  }

  return userCanDoIt;
}

function filterOutput(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);

  const secureOutput = {
    "read:user": {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    },
    "read:user:self": {
      id: resource.id,
      username: resource.username,
      email: resource.email,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    },
    "update:user": {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    },
    "update:user:others": {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    },
    "read:session": {
      expires_at: resource.expires_at,
      created_at: resource.created_at,
    },
    "update:session": {
      expires_at: resource.expires_at,
      created_at: resource.created_at,
    },
    "delete:session": {
      expires_at: resource.expires_at,
      created_at: resource.created_at,
    },
    "read:activation_token": {
      user_id: resource.user_id,
      expires_at: resource.expires_at,
      used_at: resource.used_at,
    },
    "read:migrations": migrationFilter(),
    "create:migrations": migrationFilter(),
  };

  function migrationFilter() {
    if (Array.isArray(resource)) {
      return resource.map((migration) => {
        return {
          name: migration.name,
          timestamp: migration.timestamp,
        };
      });
    } else {
      return {};
    }
  }

  const response = secureOutput[feature];
  if (!response) {
    return {};
  } else {
    return response;
  }
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;
