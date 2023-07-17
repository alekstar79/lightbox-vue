Vue.prototype.$fullscreen = (function(fullscreen) {
  const isEnabled = false, fn = {}

  if (!fullscreen.some(map => {
    if (map[1] in document) {
      for (let i = 0; i < map.length; i++) {
        fn[fullscreen[0][i]] = map[i]
      }

      return true
    }

    return false
  })) {
    return { isEnabled }
  }

  const eventMap = { change: fn.fullscreenchange, error: fn.fullscreenerror },

    handler = {
      toggle(element, options)
      {
        return this.isFullscreen ? this.exit() : this.request(element, options)
      },
      request(element, options)
      {
        return new Promise((resolve, reject) => {
          const onFullScreenEntered = () => {
            this.off('change', onFullScreenEntered)
            resolve(this.isFullscreen)
          }

          this.on('change', onFullScreenEntered)

          element ||= document.documentElement

          let request = element[fn.requestFullscreen](options)

          if (request instanceof Promise) {
            request.then(onFullScreenEntered).catch(reject)
          }
        })
      },
      exit()
      {
        return new Promise((resolve, reject) => {
          if (!this.isFullscreen) return resolve(false)

          const onFullScreenExit = () => {
            this.off('change', onFullScreenExit)
            resolve(this.isFullscreen)
          }

          this.on('change', onFullScreenExit)

          let exit = document[fn.exitFullscreen]()

          if (exit instanceof Promise) {
            exit.then(onFullScreenExit).catch(reject)
          }
        })
      },
      on(event, callback)
      {
        const eventName = eventMap[event]

        if (eventName) {
          document.addEventListener(eventName, callback, false)
        }
      },
      off(event, callback)
      {
        const eventName = eventMap[event]

        if (eventName) {
          document.removeEventListener(eventName, callback, false)
        }
      }
    }

  Object.defineProperties(handler, {
    isFullscreen: {
      get() {
        return Boolean(document[fn.fullscreenElement])
      }
    },
    isEnabled: {
      enumerable: true,
      get() {
        return Boolean(document[fn.fullscreenEnabled])
      }
    },
    element: {
      enumerable: true,
      get() {
        return document[fn.fullscreenElement]
      }
    }
  })

  return handler

})([
  [
    'requestFullscreen',
    'exitFullscreen',
    'fullscreenElement',
    'fullscreenEnabled',
    'fullscreenchange',
    'fullscreenerror'
  ],[
    'webkitRequestFullscreen',
    'webkitExitFullscreen',
    'webkitFullscreenElement',
    'webkitFullscreenEnabled',
    'webkitfullscreenchange',
    'webkitfullscreenerror'
  ],[
    'webkitRequestFullScreen',
    'webkitCancelFullScreen',
    'webkitCurrentFullScreenElement',
    'webkitCancelFullScreen',
    'webkitfullscreenchange',
    'webkitfullscreenerror'
  ],[
    'mozRequestFullScreen',
    'mozCancelFullScreen',
    'mozFullScreenElement',
    'mozFullScreenEnabled',
    'mozfullscreenchange',
    'mozfullscreenerror'
  ],[
    'msRequestFullscreen',
    'msExitFullscreen',
    'msFullscreenElement',
    'msFullscreenEnabled',
    'MSFullscreenChange',
    'MSFullscreenError'
  ]
])

Vue.prototype.$bus = new Vue()

new Vue({
  render: h => h({
    template: '#app-template',

    components: {
      lightbox,
      gallery
    }
  })
})
  .$mount('#app')
