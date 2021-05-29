import React from 'react';

export default class Footer extends React.Component {
    render() {
        return (
            <footer>
                <h4>
                    Developed with &lt;3 by Rahul Yedida at NC State University
                </h4>
                <p className="disclaimer">
                    Disclaimer: The material located at this site is not endorsed, 
                    sponsored or provided by or on behalf of North Carolina State University.
                </p>
            </footer>
        )
    }
}