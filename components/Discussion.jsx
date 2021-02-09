import React from 'react';
import PropTypes from 'prop-types';

import Comment from './Comment.jsx';

class Discussion extends React.Component {
    render() {
        const body = this.props.comments.map(
            (x, i) => <Comment key={i}
                username={x.username}
                upvotes={x.upvotes}
                text={x.text}
                date={x.date}
                replies={x.replies} />);

        return (
            <div>
                {body}
            </div>
        );
    }
}

Discussion.propTypes = {
    title: PropTypes.string.isRequired,
    comments: PropTypes.array.isRequired
};

export default Discussion;
