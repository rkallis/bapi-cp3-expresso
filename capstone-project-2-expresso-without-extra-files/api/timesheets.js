const express = require('express');
const timesheetsRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// *******
// Generic calls and functions
// *******

// Check if all fields are present
const validateTimesheet = function(req, res, next) {
  const newTimesheet = req.body.timesheet;
  if (!newTimesheet.hours || !newTimesheet.rate || !newTimesheet.date) {
    res.sendStatus(400);
  } else {
    next();
  };
};


// Generic check if :timesheetId is valid
timesheetsRouter.param('timesheetId', function(req, res, next, timesheetId) {
  const sql = 'SELECT * FROM Timesheet WHERE id = $timesheetId';
  const values = {$timesheetId: timesheetId};
  db.get(sql, values, function(err, row) {
    if (err) {
      next(err);
    } else if (row) {
      req.timesheet = row;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

// *******
// Routing
// *******

// GET /api/employees/:employeeId/timesheets -> Return all timesheets for employee
timesheetsRouter.get('/', function(req, res, next) {
  const sql = 'SELECT * FROM Timesheet WHERE employee_id = $employee_id';
  const values = {$employee_id: req.employee.id};

  db.all(sql, values, function(err, rows) {
    if (err) {
        next(err);
    } else {
      res.status(200).json({timesheets: rows});
    }
  });
});


// POST /api/employees/:employeeId/timesheets -> Create a new timesheet for employee
timesheetsRouter.post('/', validateTimesheet, function(req, res, next) {
  const newTimesheet = req.body.timesheet;
  const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id)' +
            'VALUES ($hours, $rate, $date, $employee_id)';
  const values = {
    $hours: newTimesheet.hours,
    $rate: newTimesheet.rate,
    $date: newTimesheet.date,
    $employee_id: req.employee.id
  }

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      db.get('SELECT * FROM Timesheet WHERE id = ' + this.lastID, function(err, row) {
        if (err) {
          next(err)
        } else {
          res.status(201).json({timesheet: row});
        }
      });
    }
  });
});


// PUT /api/employees/:employeeId/timesheets/:timesheetId -> Update single timesheet
timesheetsRouter.put('/:timesheetId', validateTimesheet, function(req, res, next) {
  const employeeId = req.employee.id;
  const timesheetId = req.params.timesheetId;
  const newTimesheet = req.body.timesheet;
  const sql = 'UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employee_id' +
          ' WHERE id = $id';
  const values = {
    $hours: newTimesheet.hours,
    $rate: newTimesheet.rate,
    $date: newTimesheet.date,
    $employee_id: employeeId,
    $id: timesheetId
  };
  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      db.get('SELECT * FROM Timesheet WHERE id = ' + timesheetId, function(err, row) {
        if (err) {
          next(err)
        } else {
          res.status(200).json({timesheet: row});
        }
      });
    }
  });
});


// DELETE /api/employees/:employeeId/timesheets/:timesheetId -> Deletes single timesheet
timesheetsRouter.delete('/:timesheetId', function(req, res, next) {
  const sql = 'DELETE FROM Timesheet WHERE id = $id';
  const values = {$id: req.params.timesheetId};

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});



module.exports = timesheetsRouter;
