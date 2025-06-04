from datetime import datetime
from app.main import get_current_user, get_session
from app.models import Comment, User, Vote
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.routes.user import UserView

app = APIRouter()


class CommentCreate(BaseModel):
    thread_id: int
    content: str
    parent_id: int | None = None
    user_id: int | None = None


class CommentView(BaseModel):
    id: int
    thread_id: int
    content: str
    created_at: datetime
    parent_comment_id: int | None = None
    user: UserView
    vote: list[Vote] = []


@app.post("/comment", response_model=Comment)
def create_comment(
    comment: CommentCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    if comment.user_id is None:
        comment.user_id = user.id
    new_comment = Comment(
        thread_id=comment.thread_id,
        content=comment.content,
        parent_id=comment.parent_id,
        user_id=comment.user_id,
    )
    session.add(new_comment)
    session.commit()
    session.refresh(new_comment)
    return new_comment


@app.get("/comments", response_model=list[CommentView])
def read_all_comments(
    skip: int = 0, limit: int = 10, session: Session = Depends(get_session)
):
    comments = session.exec(
        select(Comment)
        .options(
            selectinload(Comment.user),  # Load associated User
        )
        .where(Comment.user_id == User.id)
        .offset(skip)
        .order_by(Comment.id.desc())
    )
    votes = session.exec(select(Vote).where(Vote.comment_id is not None)).all()

    view = []
    for c in comments:
        comment = CommentView(
            id=c.id,
            thread_id=c.thread_id,
            content=c.content,
            created_at=c.created_at,
            parent_comment_id=c.parent_comment_id,
            user=UserView(
                id=c.user.id,
                username=c.user.username,
                email=c.user.email,
                role=c.user.role,
                organization=c.user.organization,
            ),
            vote=[v for v in votes if v.comment_id == c.id] if votes else [],
        )
        view.append(comment)

    return view


@app.get("/comments/{thread_id}", response_model=list[CommentView])
def read_comments(thread_id: int, session: Session = Depends(get_session)):
    comments = session.exec(
        select(Comment)
        .options(
            selectinload(Comment.user),  # Load associated User
        )
        .where(Comment.thread_id == thread_id)
        .order_by(Comment.id.desc())
    )
    view = []
    votes = session.exec(select(Vote).where(Vote.comment_id is not None)).all()

    for c in comments:
        comment = CommentView(
            id=c.id,
            thread_id=c.thread_id,
            content=c.content,
            created_at=c.created_at,
            parent_comment_id=c.parent_comment_id,
            user=UserView(
                id=c.user.id,
                username=c.user.username,
                email=c.user.email,
                role=c.user.role,
                organization=c.user.organization,
            ),
            vote=[v for v in votes if v.comment_id == c.id] if votes else [],
        )
        view.append(comment)

    return view


@app.put("/comments/{comment_id}", response_model=Comment)
def update_comment(
    comment_id: int,
    comment: CommentCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    comment_to_update = session.exec(
        select(Comment).where(Comment.id == comment_id, Comment.user_id == user.id)
    ).first()
    if not comment_to_update:
        raise HTTPException(
            status_code=404,
            detail="Comment not found or you do not have permission to update it",
        )

    comment_to_update.content = comment.content
    comment_to_update.parent_id = comment.parent_id
    session.commit()
    session.refresh(comment_to_update)
    return comment_to_update


@app.delete("/comments/{comment_id}", response_model=Comment)
def delete_comment(
    comment_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    comment_to_delete = session.exec(
        select(Comment).where(Comment.id == comment_id, Comment.user_id == user.id)
    ).first()
    if not comment_to_delete:
        raise HTTPException(
            status_code=404,
            detail="Comment not found or you do not have permission to delete it",
        )

    session.delete(comment_to_delete)
    session.commit()
    return comment_to_delete
