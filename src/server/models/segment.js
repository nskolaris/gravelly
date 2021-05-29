'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Segment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Segment.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    route: DataTypes.GEOMETRY,
    strava_link: DataTypes.STRING,
    UserId: DataTypes.INTEGER,
    flag_count: DataTypes.INTEGER, //TODO: replace with a link table, inclde 'flag_reason'
    is_removed: DataTypes.BOOLEAN,
    chunkyness: DataTypes.INTEGER,
    waytype: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Segment',
  });
  return Segment;
};
