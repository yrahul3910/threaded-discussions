import React from 'react';

class Navbar extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ul className='nav-sticky'>
                <li><h3>Discuss</h3></li>
                <li><h4>Disconnect</h4></li>
            </ul>
        );
    }
}

export default Navbar;
