import React from 'react';

class Navbar extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ul className='nav-sticky'>
                <li><h2>Discuss</h2></li>
                <li><h3>Disconnect</h3></li>
            </ul>
        );
    }
}

export default Navbar;
