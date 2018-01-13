const express = require('express');
const menusRouter = express.Router();
const menuItemsRouter = require('./menu-items.js');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// All calls starting with /api/menus/:menuId/menu-items to use menu-itemsRouter (menu-items.js)
menusRouter.use('/:menuId/menu-items', menuItemsRouter);

// *******
// Generic calls and functions
// *******

// Check if all fields are present
const validateMenu = function(req, res, next) {
  if (!req.body.menu.title) {
    res.sendStatus(400);
  } else {
    next();
  };
};

// Generic check if :menuId is valid
menusRouter.param('menuId', function(req, res, next, menuId) {
  const sql = 'SELECT * FROM Menu WHERE id = $menuId';
  const values = {$menuId: menuId};
  db.get(sql, values, function(err, row) {
    if (err) {
      next(err);
    } else if (row) {
      req.menu = row;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});


// *******
// Routing
// *******

// GET /api/menus -> Return all menus
menusRouter.get('/', function(req, res, next) {
  const sql = 'SELECT * FROM Menu';
  db.all(sql, function(err, rows) {
    if (err) {
      next(err);
    } else {
      res.status(200).json({menus: rows});
    }
  });
});

// POST /api/menus -> Create single menu
menusRouter.post('/', validateMenu, function(req, res, next) {
  const sql = 'INSERT INTO Menu (title) VALUES ($title)';
  const values = {$title: req.body.menu.title};

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      db.get('SELECT * FROM Menu WHERE id = '+ this.lastID, function (err,row) {
        if (err) {
          next(err);
        } else {
          res.status(201).json({menu: row});
        }
      });
    }
  });
});

// GET /api/menus/:menuId -> Get single menu
menusRouter.get('/:menuId', function(req, res, next) {
  res.status(200).json({menu: req.menu});
});


// PUT /api/menus/:menuId -> Update single menu
menusRouter.put('/:menuId', validateMenu, function(req, res, next) {
  const menuId = req.params.menuId;
  const sql = 'UPDATE Menu SET title = $title WHERE id = $id';
  const values = {
    $id: menuId,
    $title: req.body.menu.title
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      const sql = 'SELECT * FROM Menu WHERE id = ' + menuId;
      db.get(sql, function (err, row) {
        if (err) {
          next(err);
        } else {
          res.status(200).json({menu: row});
        }
      });
    }
  });
});


// DELETE /api/menus/:menuId -> Delete single menu
menusRouter.delete('/:menusId', function(req, res, next) {
  const sql = 'SELECT * FROM MenuItem WHERE menu_id = ' + req.params.menusId;
  db.get(sql, function(err, row) {
    if (row) {
      res.sendStatus(400);
    } else {
      const sql = 'DELETE FROM Menu WHERE id = $id';
      const values = {$id: req.params.menusId};
      db.run(sql, values, function(err) {
        if (err) {
          next(err);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});



module.exports = menusRouter;
