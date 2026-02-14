from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

from app.core.config import settings

def get_secret_from_keyvault(secret_name: str) -> str:
    """
    Fetch secret securely using Managed Identity.
    No client secrets required.
    Works only inside Azure App Service / AKS.
    """

    # Managed Identity Authentication
    credential = DefaultAzureCredential()

    client = SecretClient(
        vault_url=settings.KEYVAULT_URL,
        credential=credential,
    )

    secret = client.get_secret(secret_name)

    return secret.value