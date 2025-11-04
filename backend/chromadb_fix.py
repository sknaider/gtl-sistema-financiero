# ChromaDB SQLite fix para AlmaLinux
__import__('pysqlite3')
import sys
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
