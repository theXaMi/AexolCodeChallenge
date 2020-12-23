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
    constructor(props: any) {
        super(props);
        this.moving = new Animated.ValueXY({ x: this.state.x, y: this.state.y });
    }
    state = {
        x: Dimensions.get('window').width*0.90/2 - styles.player.width/2,
        y: Dimensions.get('window').height*0.90/2 - styles.player.height/2,
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
        //#region Brick interaction
        bricks.map((b, i) => {
            if (this.state.x >= b.state.x &&
                this.state.x <= b.state.x + b.state.w &&
                this.state.y >= b.state.y &&
                this.state.y <= b.state.y + b.state.h
            ) {
                this.state.momentum.x = -this.state.momentum.x;
                this.state.momentum.y = -this.state.momentum.y;
                if (Math.abs(this.state.momentum.x + this.state.momentum.y) > b.state.toughness) {
                    b.destroybrick();
                }
            }
        });
        //#endregion
        Animated.timing(this.moving, { toValue: { x: this.state.x, y: this.state.y }, useNativeDriver: false, duration: 1 }).start();
        setTimeout(() => { this.movement() }, 10);
    }

    render() {
        const spin = this.state.arrowrot.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
        return (
            <View>
                <Animated.View style={[styles.arrow, {
                    width: this.state.arrowsize,
                    left: Animated.add(Animated.subtract(this.moving.x, Animated.divide(this.state.arrowsize, 2)),styles.player.width/2),
                    top: Animated.add(this.moving.y,styles.player.width/2),
                    opacity: this.state.arrowshown,
                    transform: [{ rotate: spin }],
                }]} />
                <Animated.View style={[styles.player, {
                    left: this.moving.x,
                    top: this.moving.y
                }]} />
            </View>
        );
    }
}

class Brick extends React.Component {
    constructor(props: { x: number, y: number, text: string, toughness: number}) {
        super(props);
        if (props.toughness == undefined) this.state.toughness = 0;
    }
    state = {
        text: this.props.text,
        brickanimin: new Animated.Value(0),
        textin: new Animated.Value(0),
        brickanim: new Animated.Value(1),
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        toughness: this.props.toughness,
        dead: false,
    }

    destroybrick() {
        Animated.timing(this.state.brickanim, { toValue: 0, useNativeDriver: false, duration: 1000 }).start();
        bricks.pop();
        this.setState({ dead: true });
    }

    componentDidMount() {
        Animated.timing(this.state.brickanimin, { toValue: 1, useNativeDriver: false, duration: 2000 }).start();
        setTimeout(() => {
            Animated.timing(this.state.textin, { toValue: 1, useNativeDriver: false, duration: 1 }).start();
            bricks.push(this);
        }, 2000)
    }

    render() {
        if (this.state.dead) // There must be other way to do that, that I don't know of.
            return (
                <Animated.View style={{ alignSelf: 'flex-start' , opacity: 0}}>
                    <Text style={[styles.bricktext, {
                        left: this.props.x,
                        top: this.props.y + styles.bricktext.fontSize + 5,
                    }]}>
                        {this.state.text}
                    </Text>
                    <Animated.View style={[styles.brick, {
                        left: this.props.x,
                        top: this.props.y,
                        alignSelf: 'flex-start',
                        opacity: this.state.brickanim,
                    }]}
                        onLayout={(evt) => {
                            this.state.x = evt.nativeEvent.layout.x;
                            this.state.y = evt.nativeEvent.layout.y;
                            this.state.w = evt.nativeEvent.layout.width;
                            this.state.h = evt.nativeEvent.layout.height;
                        }}
                    >
                        <Text style={[styles.bricktext, { opacity: 0 }]}>{this.state.text}</Text>
                    </Animated.View>
                    {this.props.children}
                </Animated.View>
            );
        else
            return (
                <Animated.View style={{ alignSelf: 'flex-start', opacity: this.state.brickanimin }}>
                    <Animated.Text style={[styles.bricktext, {
                        left: this.props.x,
                        top: this.props.y + styles.bricktext.fontSize + 5,
                        opacity: this.state.textin,
                    }]}>
                        {this.state.text}
                    </Animated.Text>
                    <Animated.View style={[styles.brick, {
                        left: this.props.x,
                        top: this.props.y,
                        alignSelf: 'flex-start',
                        opacity: this.state.brickanim,
                    }]}
                        onLayout={(evt) => {
                            this.state.x = evt.nativeEvent.layout.x;
                            this.state.y = evt.nativeEvent.layout.y;
                            this.state.w = evt.nativeEvent.layout.width;
                            this.state.h = evt.nativeEvent.layout.height;
                        }}
                    >
                        <Text style={[styles.bricktext, { opacity: 0 }]}>{this.state.text}</Text>
                    </Animated.View>
                </Animated.View>
                );
    }
}
const bricks = Array<Brick>();

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
                    onResponderStart={(evt) => { this.player.startgesture(evt) }}
                >
                    <Player ref={plr => { this.player = plr }} />
                    <Brick x={50} y={50} text="Hello" toughness={50}>
                        <Brick x={50} y={100} text="This is sample project" toughness={30}>
                            <Brick x={20} y={150} text="Michal Modzelewski" toughness={10}>
                                <Brick x={10} y={200} text="2020" />
                            </Brick>
                        </Brick>
                    </Brick>
                </View>
            </View>
        );
    }
}

//#region Styles
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
    arrow: {
        position: 'absolute',
        backgroundColor: 'transparent',
        height: 3,
        alignItems: 'center',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftColor: '#fff',
        borderLeftWidth: 100,
        borderBottomColor: 'transparent',
    },
    bricktext: {
        color: '#fff',
        fontSize: 30,
    },
    brick: {
        backgroundColor: '#f70'
    }
});
//#endregion

export default iCV;

