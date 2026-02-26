'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('patients', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      nombre_completo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      correo: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      telefono: {
        type: Sequelize.STRING,
        allowNull: true
      },
      direccion: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fecha_nacimiento: {
        type: Sequelize.DATE,
        allowNull: true
      },
      genero: {
        type: Sequelize.STRING,
        allowNull: true
      },
      antecedentes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Agregar índices básicos
    await queryInterface.addIndex('patients', ['nombre_completo']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('patients');
  }
};
