const supportedModifiers = ['altKey', 'metaKey', 'ctrlKey', 'shiftKey']

const keybind = Vue.component('keybind', {
  props: {
    keyEvent: {
      type: String,
      default: 'keydown'
    },
    keyCode: {              // for single key code
      type: Number,
      default: null
    },
    modifiers: {            // shiftKey | ctrlKey | altKey | metaKey
      type: Array,
      default: () => []
    },
    multipleKeys: {         // for multiple key codes
      type: Array,
      default: () => []
    },
    preventDefault: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    keyListeners: []
  }),
  methods: {
    setup()
    {
      this.addEventListener({
        preventDefault: this.preventDefault,
        multipleKeys: this.multipleKeys,
        modifiers: this.modifiers,
        keyEvent: this.keyEvent,
        keyCode: this.keyCode
      })
    },
    addEventListener(expectedEvent)
    {
      const listener = this.eventHandler(expectedEvent)

      window.addEventListener(expectedEvent.keyEvent, listener)

      this.keyListeners.push({ expectedEvent, listener })
    },
    removeEventListeners()
    {
      for (const { keyEvent, listener } of this.keyListeners) {
        window.removeEventListener(keyEvent, listener)
      }
    },
    eventHandler(expectedEvent)
    {
      return event => {
        const emit = emitEvent => this.$emit(emitEvent, { event, expectedEvent }),
          multipleKeysMode = expectedEvent.multipleKeys.length > 0

        if (!expectedEvent.keyCode && !multipleKeysMode) {
          return emit('success')
        }

        const expectedInputs = multipleKeysMode
          ? expectedEvent.multipleKeys
          : [expectedEvent]

        for (const expectedInput of expectedInputs) {
          if (expectedInput.keyCode !== event.keyCode) continue

          if (expectedInput.modifiers?.length > 0) {
            const modifiersPressed = supportedModifiers.every(x => event[x] === (expectedInput.modifiers.includes(x)))
            if (!modifiersPressed) continue
          }
          if (expectedEvent.preventDefault) {
            event.preventDefault()
          }

          emit('success')

          return
        }

        emit('wrong')
      }
    }
  },
  beforeDestroy()
  {
    this.removeEventListeners()
  },
  mounted()
  {
    this.setup()
  }
})
