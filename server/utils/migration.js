const mongoose = require("mongoose");
const User = require("../models/User");

/**
 * runMigration()
 * --------------
 * Advanced raw database integrity and sanitization script.
 * Bypasses Mongoose casting by using the raw MongoDB driver, ensuring
 * that any invalid string types are read exactly as stored in the DB,
 * and converts them to valid ObjectIds.
 */
const runMigration = async () => {
  console.log("🛠️  Running raw database integrity migration check...");

  try {
    const users = await User.find({}).lean();
    const usernameToId = {};
    users.forEach((u) => {
      if (u.username) {
        usernameToId[u.username.toLowerCase().trim()] = u._id;
      }
    });

    const db = mongoose.connection.db;
    const expensesCollection = db.collection("expenses");
    const groupsCollection = db.collection("groups");

    // 1. Sanitize Group Memberships in Raw DB
    const rawGroups = await groupsCollection.find({}).toArray();
    let groupsSanitized = 0;

    for (const group of rawGroups) {
      let groupModified = false;
      const updatedMembers = [];

      if (group.members && group.members.length > 0) {
        for (const m of group.members) {
          if (!m.user) continue;
          const mStr = m.user.toString().toLowerCase().trim();
          if (mStr && !mongoose.Types.ObjectId.isValid(mStr)) {
            const matchedUserId = usernameToId[mStr];
            if (matchedUserId) {
              m.user = matchedUserId;
              updatedMembers.push(m);
              groupModified = true;
            } else {
              console.warn(`⚠️  Unresolved group member username "${m.user}" in group "${group.name}". Removing member.`);
              groupModified = true;
            }
          } else {
            updatedMembers.push(m);
          }
        }
      }

      if (groupModified) {
        await groupsCollection.updateOne(
          { _id: group._id },
          { $set: { members: updatedMembers } }
        );
        groupsSanitized++;
      }
    }

    if (groupsSanitized > 0) {
      console.log(`✅ Raw sanitization complete: Sanitized group membership references in ${groupsSanitized} groups.`);
    }

    // 2. Sanitize Expenses in Raw DB
    const rawExpenses = await expensesCollection.find({}).toArray();
    let migratedCount = 0;

    for (const exp of rawExpenses) {
      let isModified = false;
      const updateFields = {};

      // Resolve group details for fallbacks
      let groupDocCached = null;
      const getGroupCreator = async () => {
        if (!groupDocCached && exp.groupId) {
          groupDocCached = await groupsCollection.findOne({ _id: exp.groupId });
        }
        return groupDocCached?.createdBy || null;
      };

      // A. Migrate paidBy
      if (exp.paidBy) {
        const paidByStr = exp.paidBy.toString().toLowerCase().trim();
        if (paidByStr && !mongoose.Types.ObjectId.isValid(paidByStr)) {
          const matchedUserId = usernameToId[paidByStr];
          if (matchedUserId) {
            updateFields.paidBy = matchedUserId;
          } else {
            // If we cannot resolve the username, fall back to addedBy or Group creator
            const creatorFallback = await getGroupCreator();
            const fallback = exp.addedBy || creatorFallback || null;
            console.warn(`⚠️  Unresolved paidBy username "${exp.paidBy}" in expense "${exp.title}". Falling back to ${fallback}.`);
            updateFields.paidBy = fallback;
          }
          isModified = true;
        }
      }

      // B. Migrate contributors
      if (exp.contributors && exp.contributors.length > 0) {
        const updatedContributors = [];
        let contributorsModified = false;

        for (const c of exp.contributors) {
          if (!c) continue;
          const cStr = c.toString().toLowerCase().trim();
          if (cStr && !mongoose.Types.ObjectId.isValid(cStr)) {
            const matchedUserId = usernameToId[cStr];
            if (matchedUserId) {
              updatedContributors.push(matchedUserId);
              contributorsModified = true;
            } else {
              console.warn(`⚠️  Unresolved contributor username "${c}" in expense "${exp.title}". Filtering out.`);
              contributorsModified = true;
            }
          } else {
            updatedContributors.push(c);
          }
        }

        if (contributorsModified) {
          updateFields.contributors = updatedContributors;
          isModified = true;
        }
      }

      // C. Migrate paidByMultiple
      if (exp.paidByMultiple && exp.paidByMultiple.length > 0) {
        const updatedMultiple = [];
        let multipleModified = false;

        for (const p of exp.paidByMultiple) {
          if (!p.member) continue;
          const pStr = p.member.toString().toLowerCase().trim();
          if (pStr && !mongoose.Types.ObjectId.isValid(pStr)) {
            const matchedUserId = usernameToId[pStr];
            if (matchedUserId) {
              updatedMultiple.push({
                ...p,
                member: matchedUserId,
              });
              multipleModified = true;
            } else {
              console.warn(`⚠️  Unresolved paidByMultiple username "${p.member}" in expense "${exp.title}". Filtering out.`);
              multipleModified = true;
            }
          } else {
            updatedMultiple.push(p);
          }
        }

        if (multipleModified) {
          updateFields.paidByMultiple = updatedMultiple;
          isModified = true;
        }
      }

      if (isModified) {
        await expensesCollection.updateOne(
          { _id: exp._id },
          { $set: updateFields }
        );
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      console.log(`✅ Raw database migration complete! Migrated ${migratedCount} old expense documents.`);
    } else {
      console.log("ℹ️  Raw database migration check complete: All records are already up to date.");
    }
  } catch (error) {
    console.error("❌ Raw database migration error:", error);
    throw error;
  }
};

module.exports = runMigration;
