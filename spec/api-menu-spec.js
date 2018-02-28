const assert = require('assert')

const {ipcRenderer, remote} = require('electron')
const {BrowserWindow, Menu, MenuItem} = remote
const {closeWindow} = require('./window-helpers')

describe('Menu module', () => {
  describe('Menu.buildFromTemplate', () => {
    it('should be able to attach extra fields', () => {
      const menu = Menu.buildFromTemplate([
        {
          label: 'text',
          extra: 'field'
        }
      ])
      assert.equal(menu.items[0].extra, 'field')
    })

    it('does not modify the specified template', () => {
      const template = [{label: 'text', submenu: [{label: 'sub'}]}]
      const result = ipcRenderer.sendSync('eval', `const template = [{label: 'text', submenu: [{label: 'sub'}]}]\nrequire('electron').Menu.buildFromTemplate(template)\ntemplate`)
      assert.deepStrictEqual(result, template)
    })

    it('does not throw exceptions for undefined/null values', () => {
      assert.doesNotThrow(() => {
        Menu.buildFromTemplate([
          {
            label: 'text',
            accelerator: undefined
          },
          {
            label: 'text again',
            accelerator: null
          }
        ])
      })
    })

    describe('Menu.buildFromTemplate should reorder based on item position specifiers', () => {
      it('should position before existing item', () => {
        const menu = Menu.buildFromTemplate([
          {
            label: '2',
            id: '2'
          }, {
            label: '3',
            id: '3'
          }, {
            label: '1',
            id: '1',
            position: 'before=2'
          }
        ])
        assert.equal(menu.items[0].label, '1')
        assert.equal(menu.items[1].label, '2')
        assert.equal(menu.items[2].label, '3')
      })

      it('should position after existing item', () => {
        const menu = Menu.buildFromTemplate([
          {
            label: '1',
            id: '1'
          }, {
            label: '3',
            id: '3'
          }, {
            label: '2',
            id: '2',
            position: 'after=1'
          }
        ])
        assert.equal(menu.items[0].label, '1')
        assert.equal(menu.items[1].label, '2')
        assert.equal(menu.items[2].label, '3')
      })

      it('should position at endof existing separator groups', () => {
        const menu = Menu.buildFromTemplate([
          {
            label: 'first',
            id: 'first'
          }, {
            type: 'separator',
            id: 'numbers'
          }, {
            label: 'a',
            id: 'a',
            position: 'endof=letters'
          }, {
            type: 'separator',
            id: 'letters'
          }, {
            label: '1',
            id: '1',
            position: 'endof=numbers'
          }, {
            label: 'b',
            id: 'b',
            position: 'endof=letters'
          }, {
            label: '2',
            id: '2',
            position: 'endof=numbers'
          }, {
            label: 'c',
            id: 'c',
            position: 'endof=letters'
          }, {
            label: '3',
            id: '3',
            position: 'endof=numbers'
          }
        ])

        assert.equal(menu.items[1].id, 'numbers')
        assert.equal(menu.items[2].label, '1')
        assert.equal(menu.items[3].label, '2')
        assert.equal(menu.items[4].label, '3')
        assert.equal(menu.items[5].id, 'letters')
        assert.equal(menu.items[6].label, 'a')
        assert.equal(menu.items[7].label, 'b')
        assert.equal(menu.items[8].label, 'c')
      })

      it('should filter excess menu separators', () => {
        const menuOne = Menu.buildFromTemplate([
          {
            type: 'separator'
          }, {
            label: 'a'
          }, {
            label: 'b'
          }, {
            label: 'c'
          }, {
            type: 'separator'
          }
        ])

        assert.equal(menuOne.items.length, 3)
        assert.equal(menuOne.items[0].label, 'a')
        assert.equal(menuOne.items[1].label, 'b')
        assert.equal(menuOne.items[2].label, 'c')

        const menuTwo = Menu.buildFromTemplate([
          {
            type: 'separator'
          }, {
            type: 'separator'
          }, {
            label: 'a'
          }, {
            label: 'b'
          }, {
            label: 'c'
          }, {
            type: 'separator'
          }, {
            type: 'separator'
          }
        ])

        assert.equal(menuTwo.items.length, 3)
        assert.equal(menuTwo.items[0].label, 'a')
        assert.equal(menuTwo.items[1].label, 'b')
        assert.equal(menuTwo.items[2].label, 'c')
      })

      it('should create separator group if endof does not reference existing separator group', () => {
        const menu = Menu.buildFromTemplate([
          {
            label: 'a',
            id: 'a',
            position: 'endof=letters'
          }, {
            label: '1',
            id: '1',
            position: 'endof=numbers'
          }, {
            label: 'b',
            id: 'b',
            position: 'endof=letters'
          }, {
            label: '2',
            id: '2',
            position: 'endof=numbers'
          }, {
            label: 'c',
            id: 'c',
            position: 'endof=letters'
          }, {
            label: '3',
            id: '3',
            position: 'endof=numbers'
          }
        ])
        assert.equal(menu.items[0].id, 'letters')
        assert.equal(menu.items[1].label, 'a')
        assert.equal(menu.items[2].label, 'b')
        assert.equal(menu.items[3].label, 'c')
        assert.equal(menu.items[4].id, 'numbers')
        assert.equal(menu.items[5].label, '1')
        assert.equal(menu.items[6].label, '2')
        assert.equal(menu.items[7].label, '3')
      })

      it('should continue inserting items at next index when no specifier is present', () => {
        const menu = Menu.buildFromTemplate([
          {
            label: '4',
            id: '4'
          }, {
            label: '5',
            id: '5'
          }, {
            label: '1',
            id: '1',
            position: 'before=4'
          }, {
            label: '2',
            id: '2'
          }, {
            label: '3',
            id: '3'
          }
        ])
        assert.equal(menu.items[0].label, '1')
        assert.equal(menu.items[1].label, '2')
        assert.equal(menu.items[2].label, '3')
        assert.equal(menu.items[3].label, '4')
        assert.equal(menu.items[4].label, '5')
      })
    })
  })

  describe('Menu.getMenuItemById', () => {
    it('should return the item with the given id', () => {
      const menu = Menu.buildFromTemplate([
        {
          label: 'View',
          submenu: [
            {
              label: 'Enter Fullscreen',
              accelerator: 'Control+Command+F',
              id: 'fullScreen'
            }
          ]
        }
      ])
      const fsc = menu.getMenuItemById('fullScreen')
      assert.equal(menu.items[0].submenu.items[0], fsc)
    })
  })

  describe('Menu.insert', () => {
    it('should store item in @items by its index', () => {
      const menu = Menu.buildFromTemplate([
        {label: '1'},
        {label: '2'},
        {label: '3'}
      ])

      const item = new MenuItem({ label: 'inserted' })

      menu.insert(1, item)
      assert.equal(menu.items[0].label, '1')
      assert.equal(menu.items[1].label, 'inserted')
      assert.equal(menu.items[2].label, '2')
      assert.equal(menu.items[3].label, '3')
    })
  })

  describe('Menu.append', () => {
    it('should add the item to the end of the menu', () => {
      const menu = Menu.buildFromTemplate([
        {label: '1'},
        {label: '2'},
        {label: '3'}
      ])

      const item = new MenuItem({ label: 'inserted' })
      menu.append(item)

      assert.equal(menu.items[0].label, '1')
      assert.equal(menu.items[1].label, '2')
      assert.equal(menu.items[2].label, '3')
      assert.equal(menu.items[3].label, 'inserted')
    })
  })

  describe('Menu.popup', () => {
    let w = null
    let menu

    beforeEach(() => {
      w = new BrowserWindow({show: false, width: 200, height: 200})
      menu = Menu.buildFromTemplate([
        {label: '1'},
        {label: '2'},
        {label: '3'}
      ])
    })

    afterEach(() => {
      menu.closePopup()
      menu.closePopup(w)
      return closeWindow(w).then(() => { w = null })
    })

    it('should emit menu-will-show event', (done) => {
      menu.on('menu-will-show', () => { done() })
      menu.popup({window: w})
    })

    it('should emit menu-will-close event', (done) => {
      menu.on('menu-will-close', () => { done() })
      menu.popup({window: w})
      menu.closePopup()
    })

    it('returns immediately', () => {
      const input = {window: w, x: 100, y: 101}
      const output = menu.popup(input)
      assert.equal(output.x, input.x)
      assert.equal(output.y, input.y)
      assert.equal(output.browserWindow, input.window)
    })

    it('works without a given BrowserWindow and options', () => {
      const {browserWindow, x, y} = menu.popup({x: 100, y: 101})

      assert.equal(browserWindow.constructor.name, 'BrowserWindow')
      assert.equal(x, 100)
      assert.equal(y, 101)
    })

    it('works with a given BrowserWindow, options and callback', (done) => {
      const {x, y} = menu.popup({
        window: w,
        x: 100,
        y: 101,
        callback: () => done()
      })

      assert.equal(x, 100)
      assert.equal(y, 101)
      menu.closePopup()
    })

    it('works with a given BrowserWindow, no options, and a callback', (done) => {
      menu.popup({window: w, callback: () => done()})
      menu.closePopup()
    })
  })

  describe('Menu.setApplicationMenu', () => {
    it('sets a menu', () => {
      const menu = Menu.buildFromTemplate([
        {label: '1'},
        {label: '2'}
      ])

      Menu.setApplicationMenu(menu)
      assert.notEqual(Menu.getApplicationMenu(), null)
    })

    it('unsets a menu with null', () => {
      Menu.setApplicationMenu(null)
      assert.equal(Menu.getApplicationMenu(), null)
    })
  })
})
