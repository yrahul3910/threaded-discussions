import React from 'react';
import PropTypes from 'prop-types';

class Start extends React.Component {
    constructor(props) {
        super(props);

        this.sessionInput = React.createRef();
    }

    render() {
        return (
            <div style={{
                display: 'flex',
                height: '100%',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '-20px 0 1rem 0'
                }}>
                    <input type="text" placeholder="Session ID" ref={this.sessionInput} />
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <button onClick={() => {this.props.inputFunc(this.sessionInput.current.value);}}>Submit</button>
                </div>
            </div>
        );
    }
}

Start.propTypes = { inputFunc: PropTypes.func.isRequired };

export default Start;
