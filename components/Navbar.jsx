import React from 'react';

class Navbar extends React.Component {
    constructor(props) {
        super(props);
    }

    disconnect() {
        localStorage.removeItem('session');
        localStorage.removeItem('user');
    }

    render() {
        return (
            <ul className='nav-sticky'>
                <li><h2>Discuss</h2></li>
                <li onClick={this.disconnect}><h3>Disconnect</h3></li>
            </ul>
        );
    }
}

export default Navbar;
