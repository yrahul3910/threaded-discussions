import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

class Comment extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const child = this.props.replies.map((x, i) => <Comment key={i} username={x.username} upvotes={x.upvotes}
            downvotes={x.downvotes} text={x.text} date={x.date} replies={x.replies} />

        );

        return (
            <Fragment>
                <div className='comment'>
                    <div className='comment-header'>
                        <span>[+]</span>
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
                    {child}
                </div>
            </Fragment>
        );
    }
}

Comment.propTypes = {
    text: PropTypes.string.isRequired,
    upvotes: PropTypes.number.isRequired,
    downvotes: PropTypes.number,
    username: PropTypes.string.isRequired,
    date: PropTypes.instanceOf(Date),
    replies: PropTypes.array.isRequired
};

export default Comment;
