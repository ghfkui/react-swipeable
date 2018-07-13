import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { Motion, spring } from 'react-motion'

class Swipeable extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
    }
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)
    this.startPos = { pageX: 0, pageY: 0 }
  }

  getDelta({ pageX: currentPageX, pageY: currentPageY }, evt) {
    const { xFreezed, yFreezed, computeDelta } = this.props
    const { pageX, pageY } = this.startPos
    const { startX, startY } = this.state
    const delta = computeDelta({
      xFreezed,
      yFreezed,
      startX,
      startY,
      startPageX: pageX,
      startPageY: pageY,
      currentPageX,
      currentPageY,
    }, evt)
    if (!('deltaX' in delta) || !('deltaX' in delta)) {
      throw Error('computeDelta must return an object which includes deltaX property and deltaY property')
    }
    const { deltaX, deltaY } = delta
    return {
      deltaX,
      deltaY,
    }
  }

  getTargetPos({ deltaX, deltaY }, evt) {
    const {
      computeTargetPos,
    } = this.props
    const { startX, startY } = this.state
    const targetPos = computeTargetPos({
      startX,
      startY,
      deltaX,
      deltaY,
    }, evt)
    if (!('targetX' in targetPos) || !('targetY' in targetPos)) {
      throw Error('computeTargetPos must return an object which includes targetX property and targetY property')
    }
    const { targetX, targetY } = targetPos
    return {
      targetX,
      targetY,
    }
  }

  updateTargetPos({ x, y }) {
    this.setState({
      x,
      y,
    })
  }

  handleTouchStart(evt, { x, y }) {
    const { onSwipeStart } = this.props
    const [touchPos] = evt.changedTouches
    this.startPos = touchPos
    this.setState({
      startX: x,
      startY: y,
    })
    onSwipeStart({
      startX: x,
      startY: y,
    }, evt)
    evt.stopPropagation()
  }

  handleTouchMove(evt) {
    const { onSwiping } = this.props
    const { startX, startY } = this.state
    const [touchPos] = evt.changedTouches
    const delta = this.getDelta(touchPos, evt)
    const { targetX, targetY } = this.getTargetPos(delta, evt)
    this.updateTargetPos({
      x: targetX,
      y: targetY,
    })
    onSwiping({
      startX,
      startY,
      ...delta,
      targetX,
      targetY,
    }, evt)
    evt.stopPropagation()
  }

  handleTouchEnd(evt) {
    const { onSwipeEnd } = this.props
    const { startX, startY } = this.state
    const [touchPos] = evt.changedTouches
    const delta = this.getDelta(touchPos, evt)
    const { targetX, targetY } = this.getTargetPos(delta, evt)
    this.updateTargetPos({
      x: targetX,
      y: targetY,
    })
    onSwipeEnd({
      startX,
      startY,
      ...delta,
      targetX,
      targetY,
    }, evt)
    evt.stopPropagation()
  }

  render() {
    const {
      className,
      style,
      springConfig,
      children,
    } = this.props
    const {
      x,
      y,
    } = this.state
    return (
      <Motion
        style={{
          x: spring(x, springConfig),
          y: spring(y, springConfig),
        }}
      >
        {
          ({ x: lx, y: ly }) => (
            <div
              className={classnames('ow-swipeable', className)}
              onTouchStart={(evt) => { this.handleTouchStart(evt, { x: lx, y: ly }) }}
              onTouchMove={this.handleTouchMove}
              onTouchEnd={this.handleTouchEnd}
              style={{
                transform: `translate3d(${lx}px, ${ly}px, 0)`,
                WebkitTransform: `translate3d(${lx}px, ${ly}px, 0)`,
                ...style,
              }}
            >
              {children}
            </div>
          )
        }
      </Motion>
    )
  }
}

Swipeable.defaultProps = {
  className: '',
  springConfig: {
    stiffness: 86,
    damping: 15,
  },
  /**
   * This is the inlined style that will be applied
   * on the root component.
   */
  style: {},
  xFreezed: false,
  yFreezed: false,

  /**
   * @param {Object} object
   * @param {boolean} object.xFreezed
   * @param {boolean} object.yFreezed
   * @param {number} object.startX
   * @param {number} object.startY
   * @param {number} object.startPageX
   * @param {number} object.startPageY
   * @param {number} object.currentPageX
   * @param {number} object.currentPageY
   * @param {Object} evt
   */
  computeDelta({
    xFreezed,
    yFreezed,
    startPageX,
    startPageY,
    currentPageX,
    currentPageY,
  }) {
    const compareMovedAngle = (x, y) => Math.atan(Math.abs(y) / Math.abs(x)) <= Math.PI / 6
    const deltaX = currentPageX - startPageX
    const deltaY = currentPageY - startPageY
    let newDeltaX = deltaX
    let newDelatY = deltaY
    if (xFreezed) {
      newDeltaX = 0
      if (compareMovedAngle(deltaX, deltaY)) {
        newDeltaY = 0
      }
    }
    if (yFreezed) {
      newDeltaY = 0
      if (compareMovedAngle(deltaY, deltaX)) {
        newDeltaX = 0
      }
    }
    return {
      deltaX: newDeltaX,
      deltaY: newDeltaY,
    }
  },

  /**
   * @param {Object} object
   * @param {number} object.startX
   * @param {number} object.startY
   * @param {number} object.deltaX
   * @param {number} object.deltaY
   * @param {Object} evt
   */
  computeTargetPos({
    startX,
    startY,
    deltaX,
    deltaY,
  }) {
    return {
      targetX: startX + deltaX,
      targetY: startY + deltaY,
    }
  },

  /**
   * @param {Object} object
   * @param {number} object.startX
   * @param {number} object.startY
   * @param {Object} evt
   */
  onSwipeStart() {},

  /**
   * @param {Object} object
   * @param {number} object.startX
   * @param {number} object.startY
   * @param {number} object.deltaX
   * @param {number} object.deltaY
   * @param {number} object.targetX
   * @param {number} object.targetY
   * @param {Object} evt
   */
  onSwiping() {},

  /**
   * @param {Object} object
   * @param {number} object.startX
   * @param {number} object.startY
   * @param {number} object.deltaX
   * @param {number} object.deltaY
   * @param {number} object.targetX
   * @param {number} object.targetY
   * @param {Object} evt
   */
  onSwipeEnd() {},
}

Swipeable.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  springConfig: PropTypes.shape({
    stiffness: PropTypes.number,
    damping: PropTypes.number,
    precision: PropTypes.number,
  }),
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.object,
  xFreezed: PropTypes.bool,
  yFreezed: PropTypes.bool,
  computeDelta: PropTypes.func,
  computeTargetPos: PropTypes.func,
  onSwipeStart: PropTypes.func,
  onSwiping: PropTypes.func,
  onSwipeEnd: PropTypes.func,
}

export default Swipeable
