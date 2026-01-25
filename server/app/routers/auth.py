from app.models.user import User
from app.core.database import Base
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.user import UserRegister, UserResponse, UserLogin
from app.schemas.common import APIResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=APIResponse[UserResponse])
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return APIResponse(success=True, data=new_user, message="User registered successfully")


@router.post("/login", response_model=APIResponse[UserResponse])
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    access_token = create_access_token(data={"sub": str(db_user.id)})
    user_response = UserResponse.model_validate(db_user)
    return APIResponse(success=True, data=user_response, message="Login successful", token=access_token)


@router.get("/me", response_model=APIResponse[UserResponse])
def get_current_user_info(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return APIResponse(success=True, data=current_user, message="User info retrieved successfully")
 
