// const a = require("../services/segment-service");
const { updateUserProfile } = require("../services/segment-service");

const updateSegmentProfile = async (functionArgs) => {
  console.log(functionArgs);
  const userId = functionArgs.id;
  const traitName = functionArgs.traitName;
  const traitValue = functionArgs.traitValue;

  const updated = await updateUserProfile(userId, traitName, traitValue);

  console.log("updated is ", updated);

  if (updated) {
    return JSON.stringify({
      [traitName]: traitValue,
      message: "Updated your profile information for future",
    });
  } else {
    return JSON.stringify({
      message: "Sorry we hit a snag updating your profile",
    });
  }
};

module.exports = updateSegmentProfile;
