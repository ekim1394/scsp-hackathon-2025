

from pydantic import BaseModel
from app.main import get_session
from app.models import User
from fastapi import Depends
from sqlmodel import Session, select
from fastapi import APIRouter, HTTPException

app = APIRouter()

class UserView(BaseModel):
    id: int
    username: str
    email: str
    role: str

@app.get("/users")
def read_users(skip: int = 0, limit: int = 10, session: Session = Depends(get_session)):
    users = session.exec(select(User).offset(skip).limit(limit)).all()
    return [
        {
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
        } for u in users
    ]
    
@app.get("/users/{user_id}")
def read_user(user_id: int, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role
    }
    
@app.delete("/users/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session)):
    user_to_delete = session.exec(select(User).where(User.id == user_id)).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    session.delete(user_to_delete)
    session.commit()
    return {"detail": "User deleted successfully"}

