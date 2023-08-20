Vue.prototype.$renderer = (function() {
  const valueInRange = ({ minScale, maxScale, scale }) => scale <= maxScale && scale >= minScale
  const hasPositionChanged = ({ pos, prevPos }) => pos !== prevPos

  const getTranslate = ({ minScale, maxScale, scale }) => ({ pos, prevPos, translate }) =>
    valueInRange({ minScale, maxScale, scale }) &&
    hasPositionChanged({ pos, prevPos })
      ? translate + (pos - prevPos * scale) * (1 - 1 / scale)
      : translate

  const getScale = ({ scale, minScale, maxScale, scaleSensitivity, deltaScale }) => {
    let newScale = scale + (deltaScale / (scaleSensitivity / scale))

    newScale = Math.max(minScale, Math.min(newScale, maxScale))

    return [scale, newScale]
  }

  const getMatrix = ({ scale, translateX, translateY, skewX = 0, skewY = 0 }) =>
    `matrix(${scale}, ${skewX}, ${skewY}, ${scale}, ${translateX}, ${translateY})`

  const defaultOptions = {
    element: document.documentElement,
    scaleSensitivity: 50,
    minScale: .1,
    maxScale: 30
  }

  return new class Renderer
  {
    constructor(options)
    {
      this.state = { transformation: { translateX: 0, translateY: 0, originX: 0, originY: 0, scale: 1 } }

      this.init(options)
    }

    init(options = {})
    {
      Object.assign(this.state, defaultOptions, options)
    }

    zoom({ x, y, deltaScale })
    {
      const { left, top } = this.state.element.getBoundingClientRect()
      const { minScale, maxScale, scaleSensitivity } = this.state
      const [ scale, newScale ] = getScale({
        scale: this.state.transformation.scale,
        scaleSensitivity,
        deltaScale,
        minScale,
        maxScale
      })

      const originX = x - left
      const originY = y - top

      const newOriginX = originX / scale
      const newOriginY = originY / scale

      const translate = getTranslate({ scale, minScale, maxScale })

      const translateX = translate({
        translate: this.state.transformation.translateX,
        prevPos: this.state.transformation.originX,
        pos: originX
      })

      const translateY = translate({
        translate: this.state.transformation.translateY,
        prevPos: this.state.transformation.originY,
        pos: originY
      })

      this.state.element.style.transformOrigin = `${newOriginX}px ${newOriginY}px`
      this.state.element.style.transform = getMatrix({
        scale: newScale,
        translateX,
        translateY
      })

      this.state.transformation = {
        originX: newOriginX,
        originY: newOriginY,
        scale: newScale,
        translateX,
        translateY
      }
    }

    pan({ originX, originY })
    {
      this.state.transformation.translateX += originX
      this.state.transformation.translateY += originY

      this.state.element.style.transform = getMatrix({
        translateX: this.state.transformation.translateX,
        translateY: this.state.transformation.translateY,
        scale: this.state.transformation.scale
      })
    }

    panTo({ originX, originY, scale })
    {
      this.state.transformation.scale = scale

      this.pan({
        originX: originX - this.state.transformation.translateX,
        originY: originY - this.state.transformation.translateY
      })
    }

    panBy({ originX, originY })
    {
      this.pan({ originX, originY })
    }
  }
})()

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
    el: '#app',

    components: {
      lightbox,
      gallery
    },
    data: () => ({
      openData: {}
    }),
    methods: {
      openLightbox(data)
      {
        this.openData = data
      }
    }
  })
})
  .$mount('#app')
