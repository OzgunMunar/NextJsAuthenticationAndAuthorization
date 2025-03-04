import { useRef, useState, useEffect } from 'react'
import axios from "axios"
import EditDeleteModal from "../Modals/EditDeleteModal"
import PostForm from "./PostForm"
import { toast } from "react-toastify";
import provideFullDateText from "@/helpers/dateFixer"
import { usePathname } from "next/navigation"
import { formatPostText } from "@/helpers/formatPostText"
import { useFeedContext } from "../Contexts/FeedContext"
import { useUserContext } from '../Contexts/UserContext';
import Link from 'next/link';
import "@/app/_styles/post.css"
import { useRouter } from 'next/navigation';

const Post = ({ post, isSinglePost = false }) => {

    const { updatePost, addComments } = useFeedContext()
    const { user, setUser } = useUserContext()

    const router = useRouter()

    const textAreaRef = useRef()
    const EditOrDeleteRef = useRef(null)
    const commentTextAreaRef = useRef()
    const commentRef = useRef()
    const pathName = usePathname()

    const [postToEdit, setPostToEdit] = useState({
        postText: "",
        postId: post._id,
        friend: "",
        imageUrlLink: "",
        location: "",
        likedBy: [{}],
        comments: [{}],
        dislikedBy: [{}]
    })

    const [comment, setComment] = useState({
        creator: user._id,
        comment: "",
        date: Date.now(),
        likedBy: []
    })

    const [isDropdown, setIsDropdown] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [expand, setExpand] = useState(isSinglePost)
    const [height, setHeight] = useState(0)
    const [isLiking, setIsLiking] = useState(false)
    const [isSaved, setIsSaved] = useState(post.isSaved)
    const [isLiked, setIsLiked] = useState(post.likedBy.includes(user._id) || false)
    const [fadeOut, setFadeOut] = useState(false)
    const [shouldRenderPost, setShouldRenderPost] = useState(true);
    const [commentsToRender, setCommentsToRender] = useState(post.comments)

    const fullDateTextForPost = provideFullDateText(post.createdAt)

    const openModal = () => {
        setIsEditModalOpen(true)
    }
    
    const EditOrDeleteOpener = () => {
        setIsDropdown(status => !status)
    }

    const closeModal = () => {
        setIsEditModalOpen(false)
    }

    const makePostDisappear = () => {

        setFadeOut(true)
        setTimeout(() => {
            setShouldRenderPost(false)
        }, 250)

    }

    useEffect(() => {

        const handleOutsideClick = (event) => {
  
            if (EditOrDeleteRef.current && !EditOrDeleteRef.current.contains(event.target)) {
              setIsDropdown(false);
            }
  
        }

        setPostToEdit({
            ...postToEdit,
            postText: post.post,
            imageUrlLink: post.imageUrlLink,
            friend: post.friend,
            location: post.location,
            likedBy: post.likedBy,
            comments: post.comments
        })

        document.addEventListener('click', handleOutsideClick);

        return () => {
          document.removeEventListener('click', handleOutsideClick);
        }
        
    }, [])

    useEffect(() => {

        if(post.comments.length > 3 & !isSinglePost) {
            setCommentsToRender(post.comments.slice(-3))
        }

        if(expand === true) {

            commentTextAreaRef.current.value = ""
            commentTextAreaRef.current.focus()
            
            setHeight(commentRef.current.scrollHeight)

        } else {
            setHeight(0)
        }

        commentRef.current.scrollTo({
            top: 0,
            behaviour: "smooth"
        })

    }, [expand, post.comments])
    
    const EditPost = async() => {

        try {

            setSubmitting(true)

            await axios.patch(`/api/post/${post._id}`, postToEdit)
                                        .then(() => toast.success("Post edited", { theme: "light" }))
                                        .catch((error) => toast.error("An error occured during editing post."), { theme: "dark" })
            
            closeModal()
            updatePost(post._id, postToEdit)
            
        } catch (error) {
            toast.error(error.data, { theme: "dark" })
        } finally {
            setSubmitting(false)
        }

    }

    const DeletePost = async(postId) => {

        try {

            await axios.delete(`/api/post/${postId}`)
            .then(() => { 

                toast.success("Post deleted", { theme: "light" })
                
                makePostDisappear()

                setUser((prevUser) => ({
                    ...prevUser,
                    postNumber: prevUser.postNumber - 1
                  }))
                
                if(isSinglePost) {
                    
                    setTimeout(() => {
                        
                        if (document.referrer === '') {

                            router.push('/')
    
                          } else {
    
                            router.back()
    
                          }

                    }, 1500);

                }

            })
            .catch((error) => toast.error("An error occured during deleting post.", { theme: "dark"} ))

        } catch (error) {

            toast.error("An error occured during deleting post.", { theme: "dark"})

        }

    }

    const LikePost = async(postId) => {

        try {

            if(isLiking)
                return

            setIsLiking(true)
            
            await axios.post("/api/post/likepost", { postId })

            if(isLiked) {
                post.likedBy.length -= 1
            } else {
                post.likedBy.length += 1
            }
            
        } catch (error) {
            toast.error(error.message, { theme: "dark" })
        } finally {
            setIsLiking(false)
            setIsLiked(val => !val)
        }

    }

    const HandleExpand = () => {
        if(isSinglePost === false) {

            setExpand(val => !val)

        }
    }

    const HandleCommentShare = async() => {
        
        if(commentTextAreaRef.current.value === "") {
            toast.info("Write a comment to share.", { theme: "light" })
            return
        }

        const postId = post._id
        comment.comment = commentTextAreaRef.current.value
        setComment(oldComment => ({
            ...oldComment,
            creator : {
                _id: user._id,
                username: user.username,
                userImageLink: user.userImageLink
            }
        }))

        await axios.patch(`/api/post/comment`, { postId, comment })
                                    .then((response) => {

                                        toast.success("Comment added", { theme: "light" })

                                        response.data.comments.map(userComment => {
                                            
                                            if(userComment.creator === user._id) {

                                                userComment.creator = {
                                                    _id: user._id,
                                                    username: user.username,
                                                    userImageLink: user.userImageLink
                                                }
                                            }

                                        })

                                        addComments(response.data)
                                        setCommentsToRender(response.data.comments)
                                        setExpand(val => !val)

                                    })
                                    .catch((error) => toast.error("An error occured during adding comment.", { theme: "dark" }))

        commentTextAreaRef.current.value = ""
        commentTextAreaRef.current.focus()

    }

    const SavePost = async(postId) => {

        let successText, unsuccessText

        if(isSaved) {
            successText = "Post unsaved."
            unsuccessText = "An error occured during unsaving the post."
        } else {
            successText = "Post saved."
            unsuccessText = "An error occured during saving the post."
        }

        await axios.post('/api/savedposts/new/', { postId })
                    .then(() => { 

                        toast.success(successText, { theme: "light" })
                        setIsSaved(val => !val)
                        if (pathName === "/savedposts") makePostDisappear()

                    })
                    .catch((error) => toast.error(unsuccessText, { theme: "dark" }))

    }

    return (
        
        shouldRenderPost ? (

            <div className={`post_container ${fadeOut ? 'removePost' : ""}`}>
                
                <div className="post_header">

                    <div className="post_header_left_section">

                        <div className="post_user_image">
                            <Link href={`/profile/${post.creator.userCodeName}`}>
                                <img src={post.creator.userImageLink} alt="Picture of the post owner" loading="lazy" className="post_photo" />
                            </Link>
                        </div>

                        <div className="post_info">
                            <p className="post_owners_name">
                                <Link href={`/profile/${post.creator.userCodeName}`}>
                                    {post.creator.username}
                                </Link>
                            </p>
                            <p className="post_posted_date">{fullDateTextForPost}</p>
                            { post.location && <p className="post_top_extra_info_text">In {post.location}</p> }
                        </div>

                    </div>

                    <div className="right_section_container">

                        <div ref={EditOrDeleteRef} className="post_header_right_actions_section">

                            <button className="right_actions_button" onClick={() => EditOrDeleteOpener()}>
                                <span>...</span>
                            </button>

                        </div>

                        {isDropdown && (

                            <div className="post_dropdown_content">

                                <p className="post_dropdown_content_action" onClick={() => SavePost(post._id)}>
                                    
                                    {
                                        isSaved ? (
                                            <>
                                                <img width="20" height="20" src="https://img.icons8.com/office/40/bookmark-ribbon--v1.png" alt="bookmark-ribbon--v1"/>
                                                <span>Unsave Post</span>
                                            </>
                                        ) : (

                                            <>
                                                <img width="20" height="20" src=" https://img.icons8.com/ios/50/bookmark-ribbon--v1.png" alt="bookmark-ribbon--v1"/>
                                                <span>Save Post</span>
                                            </>

                                        )
                                    }

                                </p>

                                {

                                    (post.creator._id !== user._id) ? (

                                        <p className="post_dropdown_content_action">
                                            <img width="20" height="20" src="https://img.icons8.com/windows/50/complaint.png" alt="report-post"/>
                                            <span>Report Post</span>
                                        </p>

                                    ):
                                    (<div></div>)

                                }

                                {
                                    (post.likedBy.length === 0 & post.comments.length === 0 & post.creator._id === user._id) ?
                                    (
                                        <p className="post_dropdown_content_action" onClick={openModal}>
                                            <img width="20" height="20" src="https://img.icons8.com/ink/48/edit.png" alt="edit-post"/>
                                            <span>Edit</span>
                                        </p>
                                    ) 
                                    :
                                    (<div></div>)
                                }

                                {
                                    (post.creator._id === user._id) ? (

                                        <p className="post_dropdown_content_action" onClick={() => DeletePost(post._id)}>

                                            <img width="20" height="20" src="https://img.icons8.com/pulsar-line/48/filled-trash.png" alt="filled-trash"/>
                                            <span>Delete</span>
                                            
                                        </p>

                                    ):
                                    (<div></div>)
                                }

                            </div>

                        )}

                    </div>
                    
                </div>

                <div className="post_body">
                    { post.post && <div>{ formatPostText(post.post) }</div> }
                </div>
                {
                    post.imageUrlLink && 
                    <div className="w-full my-3">
                        <img className="post_image rounded-xl" src={post.imageUrlLink} />
                    </div>
                }

                {
                    post.friend && 
                    <div className="w-full mb-3">
                        {post.friend && <p className="post_top_extra_info_text">&#9830; With {post.friend}</p> }
                    </div>
                }

                <div className="post_horizontal_line"></div>

                <div className="post_below_container">

                    <div className="post_like_comment_share">

                        <div className="post_action_button" onClick={() => LikePost(post._id)} aria-disabled={isLiking}>
                            {
                                isLiked ?
                                <img width="20" height="20" src="https://img.icons8.com/office/30/hearts.png" alt="hearts"/>
                                :
                                <img width="20" height="20" src="https://img.icons8.com/ios/50/like--v1.png" alt="like--v1"/>
                            }    
                            <p>{post.likedBy.length} Likes</p>
                        </div>

                        <div className="post_action_button" onClick={() => HandleExpand()}>
                            <img width="20" height="20" src="https://img.icons8.com/ios/50/chat-message--v1.png" alt="chat-message--v1"/>
                            <p>{post.comments.length} Comments</p>
                        </div>

                        <div className="post_action_button">
                            <img width="20" height="20" src="https://img.icons8.com/material-rounded/24/share.png" alt="share"/>
                            <p>Share</p>
                        </div>

                    </div>

                    <div className="post_saved_mark">
                        {
                            isSaved === true && <img width="20" height="20" src="https://img.icons8.com/office/40/bookmark-ribbon--v1.png" alt="bookmark-ribbon--v1"/>
                        }
                    </div>

                </div>
                
                <div className={`${expand ? "expanded":""} post_comment_section_container`}
                    ref={commentRef}
                    style={{ maxHeight: `${expand ? `${height + 16}px`:`${height}px`}`, overflowY: `${isSinglePost ? 'scroll':'hidden'}` }}>

                    <div className="post_horizontal_line"></div>

                    <div className="post_comment_top_section">
                        <p className="display-6">New Comment</p>
                        <button type="button" className="post_comment_top_section_share_button" onClick={() => HandleCommentShare()}>Share</button>
                    </div>

                    <div className="post_comment_middle_section">
                        
                        <textarea 
                            rows={4} 
                            placeholder={`${user.username ? `What do you think, ${user.username}?`:""}`}
                            className="post_comment_textarea overflow-hidden"
                            ref={commentTextAreaRef}
                            ></textarea>

                    </div>
                    
                    <div className="post_comment_below_section">

                        {
                            post.comments.length !== 0 && 

                                <>

                                    <div className="comment_horizontal_line"></div>
                                    
                                    <div className="post_comment_header_section">
                                        <p className="display-6">
                                            { post.comments.length > 3 & !isSinglePost ? "Last 3 Comments":"All Comments" }
                                        </p>
                                        { post.comments.length > 3 & !isSinglePost ? <Link href={`/post/${post._id}`} className="gotocomments_button">{`Go to all comments...(${post.comments.length})`}</Link>:null }
                                    </div>

                                    { commentsToRender.map((comment) => {

                                        return (

                                            <div key={comment._id}>

                                                <div className="post_comment">

                                                    <img className="post_photo" src={comment.creator.userImageLink} alt="commentator photo" />

                                                    <div className="post_comment_body">

                                                        <span className="font-bold">{comment.creator.username}</span>
                                                        <p className="text-xs mb-4">{provideFullDateText(comment.date)}</p>
                                                        <p>{comment.comment}</p>

                                                    </div>

                                                </div>

                                            </div>
                                            
                                        )

                                    })}

                                </>

                        }

                    </div>
                    
                </div>
                
                <div className={isEditModalOpen ? "modal-container active":""}>

                    <EditDeleteModal isOpen={isEditModalOpen} onClose={closeModal}>

                        <PostForm
                            type='Edit'
                            post={postToEdit}
                            setPost={setPostToEdit}
                            submitting={submitting}
                            handleSubmit={EditPost}
                            textAreaRef={textAreaRef}
                            rows={8}
                        />

                    </EditDeleteModal>
                    
                </div>

            </div>

        ) : null
    )
    
}

export default Post