# dependencies.py

from typing import Annotated
from fastapi import Depends, FastAPI, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlmodel import Session, SQLModel, create_engine, select

from app.auth import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    hash_password,
    verify_password,
)
from app.models import User

DATABASE_URL = "postgresql+psycopg2://postgres:postgres@localhost:5432/app"
engine = create_engine(DATABASE_URL)

app = FastAPI(
    title="SCSP AI+ Hackathon 2025",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    root_path="/api"
)

# Allow all origins, methods, and headers (for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello, World!"}


# Dependency
def get_session():
    with Session(engine) as session:
        yield session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = session.exec(select(User).where(User.id == user_id)).first()
    if user is None:
        raise credentials_exception
    return user


@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)



class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int | None = None

@app.post("/login", response_model=Token)
def login(username: Annotated[str, Form()], password: Annotated[str, Form()], session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == username)).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=token, user_id=user.id)

@app.post("/register", response_model=Token)
def register(user_create: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.username == user_create.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user = User(
        username=user_create.username,
        email=user_create.email,
        password_hash=hash_password(user_create.password)
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=token)

@app.get("/me")
def read_current_user(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role
    }
    
from app.routes.user import app as user_router
from app.routes.thread import app as thread_router
from app.routes.comment import app as comment_router
from app.routes.vote import app as vote_router

app.include_router(
    user_router,
    tags=["users"],
)
app.include_router(
    thread_router,
    tags=["threads"],
)
app.include_router(
    comment_router,
    tags=["comments"],
)

app.include_router(
    vote_router,
    tags=["votes"],
)

