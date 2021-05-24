'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
        'Segments',
        'flag_count',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
    )
    await queryInterface.addColumn(
        'Segments',
        'is_removed',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
    )
    await queryInterface.addColumn(
        'Segments',
        'chunkyness',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
    )
    await queryInterface.addColumn(
        'Segments',
        'waytype',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
    )
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Segments', 'flag_count')
    await queryInterface.removeColumn('Segments', 'is_removed')
    await queryInterface.removeColumn('Segments', 'chunkyness')
    await queryInterface.removeColumn('Segments', 'waytype')
  }
};
