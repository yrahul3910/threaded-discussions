import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

class Comment extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className='comment'>
                <div className='comment-header'>
                    <span className='comment-user'>
                        {this.props.username}
                    </span>
                    <span className='votes'>
                        {this.props.downvotes ?
                            this.props.upvotes - this.props.downvotes :
                            this.props.upvotes}
                    </span>
                    <span className='date'>
                        {moment(this.props.date).fromNow()}
                    </span>
                </div>
                <p className='comment-text'>{this.props.text}</p>
                <div className='comment-footer'>
                    <i className='fas fa-arrow-up'></i>
                    <i className='fas fa-arrow-down'></i>
                    <i className='fas fa-reply'></i>
                </div>
            </div>
        );
    }
}

Comment.propTypes = {
    text: PropTypes.string.isRequired,
    upvotes: PropTypes.number.isRequired,
    downvotes: PropTypes.number,
    username: PropTypes.string.isRequired,
    date: PropTypes.instanceOf(Date)
};

export default Comment;
