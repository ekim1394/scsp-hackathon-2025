

from app.main import get_current_user, get_session
from app.models import User, Vote
from fastapi import Depends
from pydantic import BaseModel
from sqlmodel import Session, select
from fastapi import APIRouter

app = APIRouter()

class VoteCreate(BaseModel):
    thread_id: int | None
    comment_id: int | None 
    vote_type: str  # "upvote" or "downvote"

vote_type_map = {
    "upvote": 1,
    "downvote": -1
}

@app.put("/vote", response_model=Vote)
def update_vote(vote_create: VoteCreate, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    existing_vote = session.exec(
        select(Vote).where(
            Vote.user_id == user.id,
            Vote.thread_id == vote_create.thread_id
        )
    ).first()

    if existing_vote:
        if existing_vote.value == vote_type_map[vote_create.vote_type]:
            # If the same vote type is submitted, remove the vote
            session.delete(existing_vote)
            session.commit()
            return {"message": "Vote removed"}
        else:
            # Update the existing vote to the new type
            existing_vote.value = vote_type_map[vote_create.vote_type]
            session.commit()
            session.refresh(existing_vote)
            return existing_vote
    
    # Create a new vote if no existing vote found
    new_vote = Vote(
        user_id=user.id,
        thread_id=vote_create.thread_id,
        value=vote_type_map[vote_create.vote_type]
    )
    session.add(new_vote)
    session.commit()
    session.refresh(new_vote)
    return new_vote
