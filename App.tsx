/* Small App in React.Native, mostly made for me to learn it.
 * 
 *  Author: XaMi
 *  Year: 2020
 * 
 */

//#region Imports
import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar,
    Animated,
    Dimensions,
    NativeEventEmitter,
    GestureResponderEvent,
    TransformsStyle,
} from 'react-native';
//#endregion

class Player extends React.Component {
    constructor(props: { arrow: Arrow }) {
        super(props);
        this.moving = new Animated.ValueXY({ x: this.state.x, y: this.state.y });
        this.arrow = props.arrow;
    }
    state = {
        x: Dimensions.get('window').width*0.90/2 - styles.player.width/2,
        y: 100,
        momentum: {x:0,y:0},
        stationary: false,
        grounded: false,
        bounceloss: 0.5,
        angularmomentum: 0,
        rotation: 0,
        reltouchcords: { x: 0, y: 0 },
        flickmultiplier: 0.2,
        friction: 0.4,

        arrowshown: new Animated.Value(0),
        arrowrot: new Animated.Value(0),
        arrowsize: new Animated.Value(100),
    }
    moving: Animated.ValueXY;
    arrow: Arrow;

    componentDidMount() {
        this.movement();
    }

    //#region Gestures
    startgesture(evt: GestureResponderEvent) {
        this.state.stationary = true;
        this.state.reltouchcords = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
        this.state.arrowshown.setValue(1);
    }

    movinggesture(evt: GestureResponderEvent) {
        this.state.stationary = true;
        let lx = evt.nativeEvent.locationX;
        let ly = evt.nativeEvent.locationY;
        let rlc = this.state.reltouchcords;
        this.state.arrowrot.setValue(270 - Math.atan((lx - rlc.x) / (ly - rlc.y)) / Math.PI * 180);
        this.state.arrowsize.setValue(Math.abs(lx-rlc.x)+Math.abs(ly-rlc.y));
    }

    movegesture(evt: GestureResponderEvent) {
        this.state.stationary = false;
        this.state.grounded = false;
        this.state.momentum = {
            x: (evt.nativeEvent.locationX - this.state.reltouchcords.x) * this.state.flickmultiplier,
            y: (evt.nativeEvent.locationY - this.state.reltouchcords.y) * this.state.flickmultiplier
        }
        this.state.arrowshown.setValue(0);
    }
    //#endregion

    movement() {
        //#region Movement
        if (!this.state.stationary) {
            this.state.momentum.y += 1
            this.state.y += this.state.momentum.y;
            this.state.x += this.state.momentum.x;
        } else {
            this.state.momentum.y = 0;
            this.state.momentum.x = 0;
        }
        if (this.state.momentum.x >= 30) {
            this.state.momentum.x = 30;
        }
        if (this.state.momentum.y >= 30) {
            this.state.momentum.y = 30;
        }
        if (this.state.grounded) {
            this.state.momentum.x *= this.state.friction;
        }
        //#endregion
        //#region Borders
        if (this.state.y >= Dimensions.get('window').height * 0.9 - styles.player.height) {
            this.state.y = Dimensions.get('window').height * 0.9 - styles.player.height;
            this.state.grounded = true;
            if (this.state.momentum.y <= 2 && this.state.momentum.x <= 2) this.state.stationary = true;
            else this.state.momentum.y *= -this.state.bounceloss;
        } else {
            this.state.grounded = false;
        }
        if (this.state.x >= Dimensions.get('window').width * 0.9 - styles.player.height) {
            this.state.x = Dimensions.get('window').width * 0.9 - styles.player.height;
            this.state.momentum.x = -this.state.momentum.x * this.state.bounceloss;
        }
        if (this.state.x <= 0) {
            this.state.x = 0;
            this.state.momentum.x = -this.state.momentum.x * this.state.bounceloss;
        }
        if (this.state.y <= 0) {
            this.state.y = 0;
            this.state.momentum.y = -this.state.momentum.y * this.state.bounceloss;
        }
        //#endregion
        Animated.timing(this.moving, { toValue: { x: this.state.x, y: this.state.y }, useNativeDriver: false, duration: 1 }).start();
        setTimeout(() => { this.movement() }, 10);
    }

    render() {
        const spin = this.state.arrowrot.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
        return (
            <View>
                <Arrow ref={arrw => { this.arrow = arrw }} />
                <Animated.View style={[styles.arrow2, {
                    width: this.state.arrowsize,
                    left: this.moving.x,
                    top: this.moving.y,
                    opacity: this.state.arrowshown,
                    transform: [{ rotate: spin }]
                }]} />
                <Animated.View style={[styles.player, {
                    left: this.moving.x,
                    top: this.moving.y
                }]} />
            </View>
        );
    }
}

class iCV extends React.Component {
    constructor(props: any) {
        super(props);
    }

    evt: GestureResponderEvent;
    player: Player;

    componentDidMount() {
        StatusBar.setHidden(true);
    }

    render() {
        return (
            <View style={styles.walls}>
                <View
                    style={styles.bg}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderRelease={(evt) => { this.player.movegesture(evt) }}
                    onResponderMove={(evt) => { this.player.movinggesture(evt) }}
                    onResponderStart={(evt) => { this.player.startgesture(evt)}}
                >
                    <Player ref={plr => { this.player = plr }} />
                </View>
            </View>
        );
    }
}

class Arrow extends React.Component {
    constructor(props: any) {
        super(props);
    }

    state = {
        size: 5,
        rotation: 0,
        shown: 1,
    }

    render() {
        let size = this.state.size;
        let rotation = this.state.rotation;
        let shown = this.state.shown;
        let rot = String(rotation) + 'deg';
        //#region Rotations
        let rad = rotation * Math.PI / 180;
        let anchor = { x: 0, y: 50 };
        let loc = { x: 50, y: 50 };
        let relloc = {
            x: Math.cos(rad) * anchor.x - Math.sin(rad) * anchor.y + loc.x,
            y: Math.sin(rad) * anchor.x + Math.cos(rad) * anchor.y + loc.y,
        };
        //#endregion
        return (
            <Animated.View style={[styles.arrowBody, {
                width: 30 * size,
                height: 25 * size,
                top: relloc.y,
                left: relloc.x,
                transform: [{ rotate: rot }],
                opacity: shown,
            }]}>
                <View style={[styles.arrowTail, {
                    width: 20 * size,
                    height: 20 * size,
                    borderTopWidth: 3 * size,
                    borderTopLeftRadius: 12 * size,
                }]} />
                <View style={[styles.arrowTriangle, {
                    borderTopWidth: 9 * size,
                    borderRightWidth: 9 * size,
                    bottom: 9 * size,
                    right: 3 * size,
                }]} />
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    bg: {
        backgroundColor: '#333',
        width: '90%',
        height: '90%',
        left: '5%',
        top: '5%',
    },
    walls: {
        flex: 1,
        backgroundColor: '#fff',
    },
    player: {
        position: 'absolute',
        width: 10,
        height: 10,
        backgroundColor: '#f00',
    },
    //#region Arrow
    arrowBody: {
        backgroundColor: "transparent",
        overflow: "visible",
        width: 30,
        height: 25,
    },
    arrowTriangle: {
        backgroundColor: "transparent",
        width: 0,
        height: 0,
        borderTopWidth: 9,
        borderTopColor: "transparent",
        borderRightWidth: 9,
        borderRightColor: "#fff",
        borderStyle: "solid",
        transform: [{ rotate: "10deg" }],
        position: "absolute",
        bottom: 9,
        right: 3,
        overflow: "visible",
    },
    arrowTail: {
        backgroundColor: "transparent",
        position: "absolute",
        borderBottomColor: "transparent",
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderTopWidth: 3,
        borderTopColor: "#fff",
        borderStyle: "solid",
        borderTopLeftRadius: 12,
        top: 1,
        left: 0,
        width: 20,
        height: 20,
        transform: [{ rotate: "45deg" }],
    },
    //#endregion
    arrow2: {
        position: 'absolute',
        backgroundColor: '#fff',
        height: 3,
        alignItems: 'center',
    }
});

export default iCV;

