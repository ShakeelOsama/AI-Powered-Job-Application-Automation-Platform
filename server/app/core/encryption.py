from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.types import TypeDecorator, LargeBinary
from app.core.config import settings

def _get_encryption_key():
    env_k = settings.DATA_ENCRYPTION_KEY
    if env_k:
        return env_k.encode()
    tmp_key = Fernet.generate_key()
    return tmp_key


def _get_fernet():
    key = _get_encryption_key()
    return Fernet(key)


class EncryptedType(TypeDecorator):
    impl = LargeBinary
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            f = _get_fernet()
            return f.encrypt(value.encode('utf-8'))
        raise ValueError("EncryptedType expects str or None")

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, (bytes, bytearray)):
            try:
                f = _get_fernet()
                return f.decrypt(bytes(value)).decode('utf-8')
            except InvalidToken:
                return None
        return value
