import hashlib
import os
import sys
import inspect
import traceback

filename = inspect.getframeinfo(inspect.currentframe()).filename
JALANGI_HOME = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(filename)), os.pardir))
WORKING_DIR = os.getcwd()

sys.path.insert(0, JALANGI_HOME+'/scripts')
import sj

print('Jalangi home is ' + JALANGI_HOME)
print('Current working directory is ' + WORKING_DIR)

jalangiArgs = ''
useCache = True

def processFile (flow, content, ext):
    try:
        url = flow.request.scheme + '://' + flow.request.host + ':' + str(flow.request.port) + flow.request.path
        name = os.path.splitext(flow.request.path_components[-1])[0] if len(flow.request.path_components) else 'index'

        hash = hashlib.md5(content).hexdigest()
        fileName = 'cache/' + flow.request.host + '/' + hash + '/' + name + '.' + ext
        instrumentedFileName = 'cache/' + flow.request.host + '/' + hash + '/' + name + '_jalangi_.' + ext
        if not os.path.exists('cache/' + flow.request.host + '/' + hash):
            os.makedirs('cache/' + flow.request.host + '/' + hash)
        if not useCache or not os.path.isfile(instrumentedFileName):
            print('Instrumenting: ' + fileName + ' from ' + url)
            with open(fileName, 'w') as file:
                file.write(content)
            sub_env = { 'JALANGI_URL': url }
            sj.execute(sj.INSTRUMENTATION_SCRIPT + ' ' + jalangiArgs + ' ' + fileName + ' --out ' + instrumentedFileName + ' --outDir ' + os.path.dirname(instrumentedFileName), sub_env)
        else:
            print('Already instrumented: ' + fileName + ' from ' + url)
        with open (instrumentedFileName, "r") as file:
            data = file.read()
        return data
    except:
        print('Exception in processFile() @ proxy.py')
        exc_type, exc_value, exc_traceback = sys.exc_info()
        lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
        print(''.join(lines))
        return content

def start(context, argv):
    global jalangiArgs
    global useCache
    if '--no-cache' in argv:
        print('Cache disabled.')
        useCache = False
        argv.remove('--no-cache')
    else:
        argv.remove('--cache')
    def mapper(p): return p if p.startswith('--') else os.path.abspath(os.path.join(WORKING_DIR, p))
    jalangiArgs = ' '.join(map(mapper, [x for x in argv[1:]]))

def response(context, flow):
    try:
        flow.response.decode()

        content_type = None
        for key in flow.response.headers.keys():
            if key.lower() == "content-type":
                content_type = flow.response.headers[key].lower()

        if content_type:
            if content_type.find('javascript') >= 0:
                flow.response.content = processFile(flow, flow.response.content, 'js')
            if content_type.find('html') >= 0:
                flow.response.content = processFile(flow, flow.response.content, 'html')
    except:
        print('Exception in response() @ proxy.py')
        exc_type, exc_value, exc_traceback = sys.exc_info()
        lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
        print(''.join(lines))
