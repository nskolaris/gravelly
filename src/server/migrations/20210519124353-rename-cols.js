'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('Pictures', 'segment_id', 'SegmentId');
    await queryInterface.renameColumn('Pictures', 'user_id', 'UserId');
    await queryInterface.renameColumn('Segments', 'user_id', 'UserId');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('Pictures', 'SegmentId', 'segment_id');
    await queryInterface.renameColumn('Pictures', 'UserId', 'user_id');
    await queryInterface.renameColumn('Segments', 'UserId', 'user_id');
  }
};
