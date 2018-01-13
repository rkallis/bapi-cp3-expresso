const express = require('express');
const apiRouter = express.Router();
const employeesRouter = require('./employees.js');
const menusRouter = require('./menus.js');

// A calls starting with /api/employees will be routed to employeesRouter (employees.js)
apiRouter.use('/employees', employeesRouter);
// A calls starting with /api/menus will be routed to menusRouter (menus.js)
apiRouter.use('/menus', menusRouter);

module.exports = apiRouter;
