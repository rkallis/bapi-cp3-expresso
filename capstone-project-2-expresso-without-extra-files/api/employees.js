const express = require('express');
const employeesRouter = express.Router();
const timesheetsRouter = require('./timesheets.js');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// All calls starting with /api/employees/:employeeId/timesheets to use timeSheetsRouter (timesheets.js)
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

// *******
// Generic calls and functions
// *******

// Check if all fields are present
const validateEmployee = function(req, res, next) {
  const newEmployee = req.body.employee;
  if (!newEmployee.name || !newEmployee.position || !newEmployee.wage) {
    res.sendStatus(400);
  } else {
    if (!newEmployee.is_current_employee) {
      req.body.employee.is_current_employee = 1;
        }
    next();
  };
};

// Generic check if :employeeID is valid
employeesRouter.param('employeeId', function(req, res, next, employeeId) {
  const sql = 'SELECT * FROM Employee WHERE id = $employeeId';
  const values = {$employeeId: employeeId};
  db.get(sql, values, function(err, row) {
    if (err) {
      next(err);
    } else if (row) {
      req.employee = row;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});


// *******
// Routing
// *******

// GET /api/employees -> Returns all employees.
employeesRouter.get('/', function(req, res, next) {
  const sql = 'SELECT * FROM Employee WHERE is_current_employee = 1';
  db.all(sql, function(err, rows) {
    if (err) {
      next(err);
    } else {
      res.status(200).json({employees: rows});
    }
  });
});

// POST /api/employees -> Creates a new employee.
employeesRouter.post('/', validateEmployee, function(req, res, next) {
  const newEmployee = req.body.employee;
  const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee)' +
            'VALUES ($name, $position, $wage, $is_current_employee)';
  const values = {
    $name: newEmployee.name,
    $position: newEmployee.position,
    $wage: newEmployee.wage,
    $is_current_employee: newEmployee.is_current_employee
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      db.get('SELECT * FROM Employee WHERE id = '+ this.lastID, function (err,row) {
        if (err) {
          next(err);
        } else {
          res.status(201).json({employee: row});
        }
      });
    }
  });
});


// GET /api/employees/:employeeId -> Returns single employee.
employeesRouter.get('/:employeeId', function(req, res, next) {
  res.status(200).json({employee: req.employee});
});

// PUT /api/employees/:employeeId -> Updates single employee
employeesRouter.put('/:employeeId', validateEmployee, function(req, res, next) {
  const employeeId = req.params.employeeId;
  const newEmployee = req.body.employee;
  const sql = 'UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $is_current_employee' +
          ' WHERE id = $id';
  const values = {
    $id: employeeId,
    $name: newEmployee.name,
    $position: newEmployee.position,
    $wage: newEmployee.wage,
    $is_current_employee: newEmployee.is_current_employee
  }

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      const sql = 'SELECT * FROM Employee WHERE id = ' + employeeId;
      db.get(sql, function (err, row) {
        if (err) {
          next(err);
        } else {
          res.status(200).json({employee: row});
        }
      });
    }
  });
});



// DELETE /api/employees/:employeeId -> Deletes single employee
employeesRouter.delete('/:employeeId', function(req, res, next) {
  const employeeId = req.params.employeeId;
  const sql = 'UPDATE Employee SET is_current_employee = $is_current_employee WHERE id = $id';
  const values = {
    $id: employeeId,
    $is_current_employee: 0
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      const sql = 'SELECT * FROM Employee WHERE id = ' + employeeId;
      db.get(sql, function (err, row) {
        if (err) {
          next(err);
        } else {
          res.status(200).json({employee: row});
        }
      });
    }

  });
});



module.exports = employeesRouter;
