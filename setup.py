from distutils.core import setup

setup(
    name='door',
    version='0.0',
    packages=['door'],
    url='https://github.com/MilicaSelakovic/door',
    license='',
    author='Milica',
    author_email='milica1793@gmail.com',
    description='class project',
    install_requires=[
        'flask',
        'audiogen',
        'pyaudio'
    ],
    entry_points='''
        [console_scripts]
        door=door.server
    '''
)
