import React from 'react';
import PropTypes from 'prop-types';

class Start extends React.Component {
    constructor(props) {
        super(props);

        this.sessionInput = React.createRef();
        this.titleInput = React.createRef();
        this.joinPassword = React.createRef();
        this.newPassword = React.createRef();
    }

    render() {
        return (
            <div className='main-page'>
                <div className='blue-background'>
                    <h2>Join a session</h2>
                    <input type="text" placeholder="Session ID" ref={this.sessionInput} />
                    <input type="password" placeholder="Password" ref={this.joinPassword} />
                    <button onClick={() => {
                        this.props.inputFunc(
                            this.sessionInput.current.value,
                            'password',
                            this.joinPassword.current.value);
                    }}>Submit</button>
                </div>
                <div>
                    <h2>Create a session</h2>
                    <input type="text" placeholder="Session title" ref={this.titleInput} />
                    <input type="password" placeholder="Choose a password" ref={this.newPassword} />
                    <button onClick={() => {
                        this.props.createFunc(this.titleInput.current.value, this.newPassword.current.value);
                    }}>Start</button>
                </div>
            </div>
        );
    }
}

Start.propTypes = {
    inputFunc: PropTypes.func.isRequired,
    createFunc: PropTypes.func.isRequired
};

export default Start;
