import React, { Component } from 'react';
import { GiftedChat } from "react-native-gifted-chat";

/**
 * @classdesc This is the main implementation class for BusChat. No other components will be found in this project
 */
export default class MyChat extends Component {
    /**
     * @var messages : All of message records of this chat interface for both bot and user
     * @var from : This state attribute holds record of the starting location
     * @var to : This state attribute holds record of the ending location
     * @var mode: This state attribute indicates whether BusChat is trying to record the starting location or the ending location
     */
    state = {
        messages: [],
        from: '',
        to: '',
        mode: 'from'
    }

    /**
     * The chatbot user object for this project
     */
    BusChatUser = {
        _id: 2,
        name: 'Bus Chat',
        avatar: null
    }

    /**
     * The main render method for this component
     */
    render() {
        console.disableYellowBox = true;
        return (
            <GiftedChat
                messages={this.state.messages}
                onSend={messages => this.onSend(messages)}
                user={{
                    _id: 1,
                }}
            />
        )
    }

    /**
     * The callback method after the component has been mounted
     */
    componentDidMount() {
        this.appendMessages('To get started, type your starting location. (Eg: Vinhomes Central Park Binh Thanh) \n\nYou can type \"reset\" anytime to reset this conversation');
    }

    /**
     * This method triggers when user sends a message to the chatbot
     * @param {*} userMessages The user message input
     */
    onSend(userMessages = []) {
        var userText = userMessages[0].text;

        if (userText == 'reset') {
            this.reset();
            return;
        }

        this.setState(previousState => ({
            messages: GiftedChat.append(previousState.messages, userMessages),
        }));

        if (this.state.mode == 'from') {
            this.setState({
                from: userText,
                mode: 'to'
            });
            this.appendMessages('Type your destination location. (Eg: Ben Thanh Market District 1)');
        } else if (this.state.mode == 'to') {
            this.setState({
                to: userText,
                mode: 'from'
            }, this.processDirection);
        }
    }

    /**
     * Process direction including
     *  - Getting "from" and "to" location from the component state
     *  - Sending Http request to backend server for transit route processing
     */
    processDirection() {
        if (this.state.from && this.state.to) {
            this.appendMessages("Bus Chat is finding a bus route for you ...");
            var self = this,
                url = 'http://buschat.eastus.cloudapp.azure.com:3000/direction/index?from=' + this.state.from + '&to=' + this.state.to;

            fetch(url)
                .then(response => {
                    console.log(response);
                    response.json()
                })
                .then(responseJson => {
                    if (responseJson.error == "No routes found") {
                        self.handleNoRoutesFound();
                        return;
                    }
                    self.sendDirectionMessages(responseJson);
                })
                .catch(this.handleDirectionError.bind(self))
        }

    }

    /**
     * This method handles the error from the Http request
     * @param {*} err The error that is passed into this argument
     */
    handleDirectionError(err) {
        console.warn(err);
        this.resetFromAndTo();
        this.sendUserError();
    }

    /**
     * If backend server responses that no routes have been found, this method displays the error message to user.
     */
    handleNoRoutesFound() {
        this.appendMessages("No routes found for your locations. Please try to be more specific. Start again by entering your starting location.");
        this.resetFromAndTo();
    }

    /**
     * This is the main method that sends the instruction to the user about the directions
     * @param {*} directions Array of routes that is returned from the backend server
     */
    sendDirectionMessages(directions) {
        try {
            this.resetFromAndTo();
            if (!Array.isArray(directions)) {
                this.sendUserError;
                return;
            }
            directions.forEach(direction => {
                if (Array.isArray(direction)) {
                    direction.forEach(subDirection => {
                        this.appendMessages(subDirection);
                    })
                } else {
                    this.appendMessages('--> ' + direction);
                }
            });
            this.appendMessages("You have arrived!");
            this.appendMessages("Type your starting location. (Eg: Ben Thanh Market)");
        } catch (err) {
            console.error(err);
            this.sendUserError();
        }
    }
    /**
     * This method reset "from", "to", and "mode" attribute in the component state
     */
    resetFromAndTo() {
        this.setState({
            from: '',
            to: '',
            mode: 'from'
        })
    }
4
    /**
     * This method resets the state and also the messages
     */
    reset() {
        this.resetFromAndTo();
        this.setState({
            messages: [],
            from: '',
            to: '',
            mode: 'from'
        }, this.componentDidMount);
    }

    /**
     * This method sends user the error message
     */
    sendUserError() {
        this.appendMessages("The server is currently not available. Please try again later. If you want to try again now, you can start by entering the starting location");
    }

    /**
     * This is a common method that append the bot's message to the chat interface
     * @param {*} text Any text that you want to response to the user
     */
    appendMessages(text) {
        this.setState((previousState) => {
            return {
                messages: GiftedChat.append(previousState.messages, {
                    _id: Math.round(Math.random() * 1000000),
                    text: text,
                    createdAt: new Date(),
                    user: this.BusChatUser,
                }),
            };
        });
    }
}