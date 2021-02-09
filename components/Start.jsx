import React from 'react';
import PropTypes from 'prop-types';

class Start extends React.Component {
    constructor(props) {
        super(props);

        this.sessionInput = React.createRef();
        this.titleInput = React.createRef();
    }

    render() {
        return (
            <div className='main-page'>
                <div className='blue-background'>
                    <h2>Join a session</h2>
                    <input type="text" placeholder="Session ID" ref={this.sessionInput} />
                    <button onClick={() => {this.props.inputFunc(this.sessionInput.current.value);}}>Submit</button>
                </div>
                <div>
                    <h2>Create a session</h2>
                    <input type="text" placeholder="Session title" ref={this.titleInput} />
                    <button onClick={() => {this.props.createFunc(this.titleInput.current.value);}}>Start</button>
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
