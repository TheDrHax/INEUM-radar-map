#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from livereload import Server


def serve(host='0.0.0.0', port=8000, root='app'):
    server = Server()
    server.watch('app')
    server.serve(host=host, port=port, root=root)


if __name__ == '__main__':
    serve()
