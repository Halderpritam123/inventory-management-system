"""
Structured logging configuration for the Inventory & Order Management System.
"""

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
)


def get_logger(name: str) -> logging.Logger:
    """Return a logger instance identified by name."""
    return logging.getLogger(name)
