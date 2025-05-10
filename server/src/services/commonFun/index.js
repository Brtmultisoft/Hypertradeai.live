'use strict';
const { userDbHandler, userreDbHandler } = require('../db');
const { userreModel } = require('../../models');

const getTopLevelByRefer = async (user_id, level = 0, arr = []) => {
        try {
            const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
            if (arr.length === level && level !== 0) {
                return arr;
            } else if (user_id === defaultUser._id) {
                return arr;
            } else {
                const user = await userDbHandler.getOneByQuery({ _id: user_id }, { refer_id: 1 });
                if (user) {
                    arr.push(user.refer_id);
                    return getTopLevelByRefer(user.refer_id, level, arr);
                } else {
                    return arr;
                }
            }
        } catch (error) {
            throw error;
        }
}

module.exports = {

    getTopLevelByRefer,

    getSingleDimensional: (twoDimensional) => {
        const singleDimensionalArray = [];
        twoDimensional.forEach(singleDimensional => {
            singleDimensional.forEach(value => {
                singleDimensionalArray.push(value);
            });
        });

        return singleDimensionalArray;
    },

    getChildLevels: async (user_id, withInitial = false, levelLimit = 0) => {
        if (user_id === null) {
            const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
            user_id = defaultUser._id;
        }
        let levels = withInitial ? [[user_id]] : [[]];

        let i = 1;
        while (true) {
            const currentLevel = (i == 1) ? [user_id] : levels[i - 1];
            const children = await userDbHandler.getByQuery({ placement_id: { $in: currentLevel } }, { _id: 1 });

            if (!children.length) break;

            const childIds = children.map(child => child._id);
            levels[i] = childIds;

            if (levelLimit && i === levelLimit) break;

            i++;
        }

        return levels;
    },

    getChildLevelsByRefer: async (user_id, withInitial = false, levelLimit = 0) => {
        console.log('Starting getChildLevelsByRefer with params:', { user_id, withInitial, levelLimit });
        try {
            // Validate and convert user_id to ObjectId if it's a string
            if (typeof user_id === 'string') {
                console.log('Converting string user_id to ObjectId:', user_id);
                const { ObjectId } = require('mongodb');
                try {
                    user_id = new ObjectId(user_id);
                    console.log('Successfully converted user_id to ObjectId:', user_id);
                } catch (error) {
                    console.error('Invalid user_id format:', error);
                    return { error: 'Invalid user ID format' };
                }
            }

            // If user_id is null, use the default user
            if (user_id === null) {
                console.log('user_id is null, fetching default user');
                const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
                if (!defaultUser) {
                    console.error('Default user not found');
                    return { error: 'Default user not found' };
                }
                user_id = defaultUser._id;
                console.log('Using default user_id:', user_id);
            }

            // Get the user data for the initial user if needed
            let initialUser = null;
            if (withInitial) {
                console.log('withInitial is true, fetching initial user data for user_id:', user_id);
                initialUser = await userDbHandler.getById(user_id, { password: 0 });
                if (!initialUser) {
                    console.error('Initial user not found for user_id:', user_id);
                    return { error: 'User not found' };
                }
                console.log('Successfully fetched initial user:', initialUser._id);
            }

            // Initialize the levels array
            // If withInitial is true, include the initial user in level 0
            let levels = [];
            if (withInitial && initialUser) {
                console.log('Adding initial user to level 0');
                levels[0] = [initialUser];
            }

            // Start from level 1 (direct referrals)
            let i = 1;
            let currentLevelIds = [user_id]; // Start with the initial user ID
            console.log('Starting level traversal with initial user_id:', user_id);

            while (true) {
                console.log(`Processing level ${i} with ${currentLevelIds.length} parent IDs`);

                // Get all users who have the current level users as their referrer
                const children = await userDbHandler.getByQuery(
                    { refer_id: { $in: currentLevelIds } },
                    { password: 0 } // Exclude password for security
                );

                console.log(`Found ${children.length} children at level ${i}`);

                // If no children found at this level, break the loop
                if (!children.length) {
                    console.log(`No children found at level ${i}, breaking loop`);
                    break;
                }

                // Store the complete user objects for this level
                levels[i] = children;
                console.log(`Added ${children.length} users to level ${i}`);

                // Prepare for the next level by extracting just the IDs
                currentLevelIds = children.map(child => child._id);
                console.log(`Extracted ${currentLevelIds.length} IDs for next level`);

                // Break if we've reached the specified level limit
                if (levelLimit && i === levelLimit) {
                    console.log(`Reached specified level limit of ${levelLimit}, breaking loop`);
                    break;
                }

                // Move to the next level
                i++;
            }

            const result = {
                success: true,
                levels: levels,
                // Include a flattened array of all users for convenience
                allUsers: levels.flat()
            };

            console.log(`Completed getChildLevelsByRefer with ${levels.length} levels and ${result.allUsers.length} total users`);
            return result;
        } catch (error) {
            console.error('Error in getChildLevelsByRefer:', error);
            return {
                error: 'Failed to retrieve referral users',
                details: error.message
            };
        }
    },

    getTopLevel: async (user_id, level = 0, arr = []) => {
        try {
            const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
            if (arr.length === level && level !== 0) {
                return arr;
            } else if (user_id === defaultUser._id) {
                return arr;
            } else {
                const user = await userDbHandler.getOneByQuery({ _id: user_id }, { placement_id: 1 });
                if (user) {
                    arr.push(user.placement_id);
                    return getTopLevel(user.placement_id, level, arr);
                } else {
                    return arr;
                }
            }
        } catch (error) {
            throw error;
        }
    },



    // returns the vacancy in binary registration
    getTerminalId: async (referId, position) => {
        if (referId === null) {
            const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
            referId = defaultUser._id;
        }
        let terminalId = referId;
        while (true) {
            const user = await userDbHandler.getOneByQuery({ placement_id: terminalId, position: position }, { _id: 1 });
            if (!user) break;
            terminalId = user._id;
        }
        return terminalId;
    },
    getPlacementId: async (referId, unum = 3) => {
        try {
            // If no referId is provided, use the default user
            if (referId === null) {
                const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
                referId = defaultUser._id;
            }

            let placementId = referId;
            let currentLevelResults = await userDbHandler.getByQuery({ placement_id: placementId }, { _id: 1 });

            // Check if the current referrer has completed their matrix
            if (currentLevelResults.length < unum) {
                return placementId;
            }

            // Traverse the matrix levels until we find an available spot
            while (true) {
                let nextLevelResults = [];

                // Traverse all users in the current level
                for (const result of currentLevelResults) {
                    const nestedResults = await userDbHandler.getByQuery({ placement_id: result._id }, { _id: 1 });

                    // If a user in the current level has not completed their matrix, place the new user under them
                    if (nestedResults.length < unum) {
                        return result._id;
                    }

                    nextLevelResults.push(...nestedResults);
                }

                // If all users in the current level have completed their matrix, move to the next level
                if (nextLevelResults.length > 0) {
                    currentLevelResults = nextLevelResults;
                } else {
                    // If no more levels are available, place the new user under the last user in the current level
                    return currentLevelResults[currentLevelResults.length - 1]._id;
                }
            }
        } catch (error) {
            throw error;
        }
    },
    // getPlacementId: async (referId, unum = 2) => {
    //     try {
    //         if (referId === null) {
    //             const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
    //             referId = defaultUser._id;
    //         }
    //         let placementId = referId;
    //         const level = [];
    //         const results = await userDbHandler.getByQuery({ placement_id: placementId }, { _id: 1 });
    //         console.log("results",results);
    //         if (results.length >= unum) {
    //             level.push(results.map(result => result._id));
    //             let i = 0;
    //             while (true) {
    //                 let found = false;
    //                 for (const result of level[i]) {
    //                     level[i + 1] = [];
    //                     const nestedResults = await userDbHandler.getByQuery({ placement_id: result._id }, { _id: 1 });
    //                     if (nestedResults.length >= unum) {
    //                         level[i + 1] = [...level[i + 1], ...nestedResults.map(nestedResult => nestedResult._id)];
    //                     } else {
    //                         placementId = result._id;
    //                         found = true;

    //                     }
    //                 }

    //                 if (!found && level[level.length - 1].length > 0) {
    //                     i++;
    //                     continue;
    //                 }
    //                 else {
    //                     break;
    //                 }
    //             }
    //         }
    //         console.log("placementId",placementId);
    //         return placementId;
    //     } catch (error) {
    //         throw error;
    //     }
    // },

    getPlacementIdByRefer: async (referId, unum = 2) => {
        try {
            if (referId === null) {
                const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
                referId = defaultUser._id;
            }
            let placementId = referId;
            const level = [];
            const results = await userDbHandler.getOneByQuery({ refer_id: placementId }, { _id: 1 });
            if (results.length >= unum) {
                level.push(results.map(result => result._id));
                let i = 0;
                while (true) {
                    let found = false;
                    for (const result of level[i]) {
                        level[i + 1] = [];
                        const nestedResults = await userDbHandler.getOneByQuery({ refer_id: result._id }, { _id: 1 });
                        if (nestedResults.length >= unum) {
                            level[i + 1] = [...level[i + 1], ...nestedResults.map(nestedResult => nestedResult._id)];
                        } else {
                            placementId = result._id;
                            found = true;
                        }
                    }

                    if (!found && level[level.length - 1].length > 0) {
                        i++;
                        continue;
                    }
                    else {
                        break;
                    }
                }
            }
            return placementId;
        } catch (error) {
            throw error;
        }
    },

    // get left and right child LEVELS of any user_id
    getChildLevelsPosition: async (user_id, position, l = 0) => {
        if (user_id === null) {
            const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
            user_id = defaultUser._id;
        }
        const level = [];
        try {
            let result = await userDbHandler.getOneByQuery({ placement_id: user_id, position: position }, { _id: 1 });
            if (result.length !== 0) {
                let i = 1;
                level[i] = result.map(row => row._id);
                while (true) {
                    let nextLevel = [];
                    for (const value of level[i]) {
                        result = await userDbHandler.getOneByQuery({ placement_id: value }, { _id: 1 });
                        result.forEach(row => nextLevel.push(row._id));
                    }
                    if (l && i === l) {
                        break;
                    }
                    if (nextLevel.length !== 0) {
                        level[i + 1] = nextLevel;
                        i++;
                    } else {
                        break;
                    }
                }
            }
            return level;
        } catch (error) {
            throw error;
        }
    },

    getUserType: () => {
        return ['Normal', 'Franchise'];
    },

    getReward: () => {
        return ['No Reward', 'Pearl', 'Ruby', 'Emerald', 'Topaz', 'Diamond', 'Pink Diamond', 'Blue Diamond', 'Black Diamond'];
    },

    getFundType: () => {
        return ['Wallet', 'Wallet Topup'];
    },

    getWalletField: () => {
        return ['wallet', 'wallet_topup'];
    },

    getTopLevelIDsByPoolRE: async (recid, level = 0, pool = 0, arr = []) => {
        try {
            let defaultArr = [];
            let defaultResults = await userreDbHandler.getByQuery({ is_re: true }, { _id: 1 });
            defaultResults.forEach(row => defaultArr.push(row._id));

            if (arr.length === level && level !== 0) {
                return arr;
            } else if (defaultArr.includes(recid)) {
                return arr;
            }
            const result = await userreDbHandler.getById(recid);
            if (result) {
                arr.push(result.placement_id);
                return await getTopLevelIDsByPoolRE(result.placement_id, level, pool, arr);
            } else {
                return arr;
            }
        } catch (error) {
            console.error('Error:', error);
            return arr;
        }
    },

    // put user in the correct place by getting the ID
    getPlacementIDRE: async (placement_uid = 0, unum = 3, pool = 1) => {
        try {
            let placementID = null;
            if (!placement_uid) {
                let defaultResult = await userreDbHandler.getOneByQuery({ is_re: true, pool: pool }, { _id: 1 });
                placementID = defaultResult._id;
            }
            else {
                // Get the latest placement_id
                const latestUserre = await userreModel.findOne({ user_id: placement_uid, pool: pool })
                    .sort({ datetime: -1 })
                    .limit(1)
                    .exec();

                if (!latestUserre) {
                    return null; // No matching user found
                }

                placementID = latestUserre._id;
            }

            let level = [];

            const result = await userreModel.find({ placement_id: placementID }).sort({ datetime: 1 }).exec();
            const num = result.length;

            if (num >= unum) {
                let i = 1;

                while (true) {
                    for (const userre of result) {
                        const subResult = await userreModel.find({ placement_id: userre._id }).sort({ datetime: 1 }).exec();

                        if (subResult.length >= unum) {
                            for (const subUserre of subResult) {
                                level[i + 1] = level[i + 1] || [];
                                level[i + 1].push(subUserre._id);
                            }
                        } else {
                            placementID = userre._id;
                            return await userreModel.findOne({ _id: placementID }).exec();
                        }
                    }

                    if (level[i + 1] && level[i + 1].length) {
                        i++;
                        continue;
                    } else {
                        break;
                    }
                }
            }

            return await userreModel.findOne({ recid: placementID }).exec();
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    },

    // particular pool k levels return karega
    getChildLevelsByPoolRE: async (recid, pool = 1, withRecid = '', l = 3) => {
        try {
            let level = [];

            // Include recid in the first level if withRecid is 'yes'
            if (withRecid === 'yes') {
                const userre = await userreModel.findOne({ _id: recid }).exec();
                level.push([userre]);
            }

            // Get the child levels
            let result = await userreModel.find({ placement_id: recid }).exec();
            let i = 1;

            while (true) {
                for (const value of result) {
                    const subResult = await userreModel.find({ placement_id: value._id }).exec();
                    level[i] = level[i] || [];

                    for (const row of subResult) {
                        level[i].push(row);
                    }
                }

                if (i === l) {
                    break;
                } else if (!level[i + 1] || level[i + 1].length === 0) {
                    break;
                }

                i++;
            }

            return level;
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    },

    getChildLevelsByPoolREByUID: async (user_id, pool = 1, level = 1, withRecid = '') => {
        try {
            // Find recid by user_id and pool
            const userreRecid = await Userre.findOne({ user_id: user_id, pool: pool })
                .sort({ datetime: 1 })
                .skip(level - 1)
                .limit(1)
                .exec();

            const recid = userreRecid ? userreRecid._id : -1;

            // Include recid in the first level if withRecid is 'yes'
            let levelArray = [];
            if (withRecid === 'yes') {
                const userre = await userreModel.findOne({ _id: recid }).exec();
                levelArray.push([userre]);
            }

            // Get the child levels
            let result = await Userre.find({ placement_id: recid }).exec();
            let i = 1;

            while (true) {
                for (const value of result) {
                    const subResult = await Userre.find({ placement_id: value._id }).exec();
                    levelArray[i] = levelArray[i] || [];

                    for (const row of subResult) {
                        levelArray[i].push(row);
                    }
                }

                if (i === 2) { // You can change this condition if needed
                    break;
                } else if (!levelArray[i + 1] || levelArray[i + 1].length === 0) {
                    break;
                }
                i++;
            }

            return levelArray;
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }
};