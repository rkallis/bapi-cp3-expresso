const express = require('express');
const menuItemsRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


// *******
// Generic calls and functions
// *******

// Check if all fields are present
const validateMenuItems = function(req, res, next) {
  const newMenuItem = req.body.menuItem;
  if (!newMenuItem.name || !newMenuItem.inventory || !newMenuItem.price) {
    res.sendStatus(400);
  } else {
    if (!newMenuItem.description) {
      req.body.menuItem.description = '';
    }
    next();
  };
};

// Generic check if :menuId is valid
menuItemsRouter.param('menuItemId', function(req, res, next, menuItemId) {
  const sql = 'SELECT * FROM MenuItem WHERE id = $menuItemId';
  const values = {$menuItemId: req.params.menuItemId};
  db.get(sql, values, function(err, row) {
    if (err) {
      next(err);
    } else if (row) {
      req.menuItem = row;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

// *******
// Routing
// *******

// GET /api/menus/:menuId/menu-items -> Return all items on a menu
menuItemsRouter.get('/', function(req, res, next) {
  const sql = 'SELECT * FROM MenuItem WHERE menu_id = $menuId';
  const values = {$menuId: req.menu.id};

  db.all(sql, values, function(err, rows) {
    if (err) {
      next (err)
    } else {
      res.status(200).json({menuItems: rows});
    }
  });
});


// POST /api/menus/:menuId/menu-items -> Create a new menu-item
menuItemsRouter.post('/', validateMenuItems, function(req, res, next) {
  const newMenuItem = req.body.menuItem;
  const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id)' +
              'VALUES ($name, $description, $inventory, $price, $menu_id)';
  const values = {
    $name: newMenuItem.name,
    $description: newMenuItem.description,
    $inventory: newMenuItem.inventory,
    $price: newMenuItem.price,
    $menu_id: req.menu.id
  }

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      db.get('SELECT * FROM MenuItem WHERE id = ' + this.lastID, function(err, row) {
        if (err) {
          next(err)
        } else {
          res.status(201).json({menuItem: row});
        }
      });
    }
  });
});


// PUT /api/menus/:menuId/menu-items/:menuItemId -> Update a menu item
menuItemsRouter.put('/:menuItemId', validateMenuItems, function(req, res, next) {
  const menuId = req.menu.id;
  const menuItemId = req.params.menuItemId;
  const newMenuItem = req.body.menuItem;
  const sql = 'UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menu_id' +
          ' WHERE id = $id';
  const values = {
    $name: newMenuItem.name,
    $description: newMenuItem.description,
    $inventory: newMenuItem.inventory,
    $price: newMenuItem.price,
    $menu_id: menuId,
    $id: menuItemId
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      db.get('SELECT * FROM MenuItem WHERE id = ' + menuItemId, function(err, row) {
        if (err) {
          next(err)
        } else {
          res.status(200).json({menuItem: row});
        }
      });
    }
  });
});


// DELETE /api/menus/:menuId/menu-items/:menuItemId -> Delete a menu item
menuItemsRouter.delete('/:menuItemId', function(req, res, next) {
  const sql = 'DELETE FROM MenuItem WHERE id = $id';
  const values = {$id: req.params.menuItemId};

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});



module.exports = menuItemsRouter;
