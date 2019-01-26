import React, { Component } from 'react';
import { GiftedChat } from "react-native-gifted-chat";
import Constants from "../constants";

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
        from: Constants.EMPTY,
        to: Constants.EMPTY,
        mode: Constants.FROM
    }

    /**
     * The chatbot user object for this project
     */
    BusChatUser = {
        _id: Constants.CHAT_BOT_ID,
        name: Constants.CHAT_BOT_NAME,
        avatar: Constants.NULL
    }

    /**
     * The main render method for this component
     */
    render() {
        console.disableYellowBox = Constants.TRUE;
        return (
            <GiftedChat
                messages={this.state.messages}
                onSend={messages => this.onSend(messages)}
                user={{
                    _id: Constants.USER_ID,
                }}
            />
        )
    }

    /**
     * The callback method after the component has been mounted
     */
    componentDidMount() {
        this.appendMessages(Constants.INTRO_PROMPT);
    }

    /**
     * This method triggers when user sends a message to the chatbot
     * @param {*} userMessages The user message input
     */
    onSend(userMessages = []) {
        var userText = userMessages[Constants.ZERO].text;

        if (userText == Constants.RESET) {
            this.reset();
            return;
        }

        this.setState(previousState => ({
            messages: GiftedChat.append(previousState.messages, userMessages),
        }));

        if (this.state.mode == Constants.FROM) {
            this.setState({
                from: userText,
                mode: Constants.TO
            });
            this.appendMessages(Constants.PROMPT_ENTER_DESTINATION);
        } else if (this.state.mode == Constants.TO) {
            this.setState({
                to: userText,
                mode: Constants.FROM
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
            this.appendMessages(Constants.PROCESSING_MSG);
            var self = this,
                url = 'http://buschat.eastus.cloudapp.azure.com:3000/direction/index?from=' + this.state.from + '&to=' + this.state.to;

            fetch(url)
                .then(response => {
                    return response.json();
                })
                .then(responseJson => {
                    if (responseJson.error && responseJson.error == Constants.NO_ROUTES_FOUND) {
                        this.handleNoRoutesFound.bind(self)();
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
        this.appendMessages(Constants.NO_ROUTES_FOUND);
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
                    this.appendMessages(Constants.ARROW + direction);
                }
            });
            this.appendMessages(Constants.ARRIVED_MSG);
            this.appendMessages(Constants.PROMPT_ENTER_FROM_LOCATION);
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
            from: Constants.EMPTY,
            to: Constants.EMPTY,
            mode: Constants.FROM
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
            from: Constants.EMPTY,
            to: Constants.EMPTY,
            mode: Constants.FROM
        }, this.componentDidMount);
    }

    /**
     * This method sends user the error message
     */
    sendUserError() {
        this.appendMessages(Constants.SERVER_ERROR_MSG);
    }

    /**
     * This is a common method that append the bot's message to the chat interface
     * @param {*} text Any text that you want to response to the user
     */
    appendMessages(text) {
        this.setState((previousState) => {
            return {
                messages: GiftedChat.append(previousState.messages, {
                    _id: Math.round(Math.random() * Constants.ONE_MILLION),
                    text: text,
                    createdAt: new Date(),
                    user: this.BusChatUser,
                }),
            };
        });
    }
}